package pro.damjan.belabackend.admin.account;

import jakarta.persistence.criteria.Predicate;
import jakarta.transaction.Transactional;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import pro.damjan.belabackend.admin.dto.response.AdminAccountActionsResponse;
import pro.damjan.belabackend.admin.dto.response.AdminAccountDetailResponse;
import pro.damjan.belabackend.admin.dto.response.AdminAccountPageResponse;
import pro.damjan.belabackend.admin.dto.response.AdminAccountPresenceResponse;
import pro.damjan.belabackend.admin.dto.response.AdminAccountSessionResponse;
import pro.damjan.belabackend.admin.dto.response.AdminAccountSummaryResponse;
import pro.damjan.belabackend.exception.ExceptionResponse;
import pro.damjan.belabackend.user.User;
import pro.damjan.belabackend.user.UserRepository;
import pro.damjan.belabackend.user.auth.AuthProvider;
import pro.damjan.belabackend.user.auth.Role;
import pro.damjan.belabackend.user.auth.refresh.RefreshTokenRepository;
import pro.damjan.belabackend.user.auth.refresh.RefreshTokenService;
import pro.damjan.belabackend.user.presence.PresenceStatus;
import pro.damjan.belabackend.user.presence.UserPresence;
import pro.damjan.belabackend.user.presence.UserPresenceService;
import pro.damjan.belabackend.user.presence.session.SessionRepository;
import pro.damjan.belabackend.user.presence.session.SessionService;
import pro.damjan.belabackend.user.presence.session.UserSession;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
public class AdminAccountService {
    public static final int PAGE_SIZE = 25;

    private final UserRepository userRepository;
    private final SessionRepository sessionRepository;
    private final SessionService sessionService;
    private final UserPresenceService presenceService;
    private final RefreshTokenService refreshTokenService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final AdminAuditLogRepository auditLogRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final Clock clock;

    public AdminAccountService(UserRepository userRepository,
                               SessionRepository sessionRepository,
                               SessionService sessionService,
                               UserPresenceService presenceService,
                               RefreshTokenService refreshTokenService,
                               RefreshTokenRepository refreshTokenRepository,
                               AdminAuditLogRepository auditLogRepository,
                               ApplicationEventPublisher eventPublisher,
                               Clock clock) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.sessionService = sessionService;
        this.presenceService = presenceService;
        this.refreshTokenService = refreshTokenService;
        this.refreshTokenRepository = refreshTokenRepository;
        this.auditLogRepository = auditLogRepository;
        this.eventPublisher = eventPublisher;
        this.clock = clock;
    }

    public AdminAccountPageResponse list(String query,
                                         String accountType,
                                         String activity,
                                         String roleValue,
                                         String cursorValue) {
        Map<String, Long> sessionCounts = liveSessionCounts();
        Set<String> activeUserIds = sessionCounts.keySet();
        AccountCursor cursor = decodeCursor(cursorValue);
        Specification<User> specification = filters(query, accountType, activity, roleValue, cursor, activeUserIds);
        Page<User> page = userRepository.findAll(
                specification,
                PageRequest.of(0, PAGE_SIZE + 1, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id")))
        );

        List<User> fetched = page.getContent();
        boolean hasMore = fetched.size() > PAGE_SIZE;
        List<User> visible = hasMore ? fetched.subList(0, PAGE_SIZE) : fetched;
        List<AdminAccountSummaryResponse> accounts = visible.stream()
                .map(user -> summary(user, sessionCounts.getOrDefault(user.getId(), 0L)))
                .toList();
        String nextCursor = hasMore && !visible.isEmpty()
                ? encodeCursor(visible.getLast())
                : null;

        return new AdminAccountPageResponse(accounts, nextCursor);
    }

    public AdminAccountDetailResponse detail(User actor, String userId) {
        User target = requireUser(userId);
        List<UserSession> sessions = sessionService.getUserSessions(userId);
        UserPresence presence = presenceService.getUserPresence(userId);
        boolean lastAdmin = target.getRole() == Role.ADMIN && userRepository.countByRole(Role.ADMIN) <= 1;

        return new AdminAccountDetailResponse(
                target.getId(),
                target.getUsername(),
                target.getEmail(),
                target.getBio(),
                target.getAvatarUrl(),
                target.getCountryCode(),
                target.getAuthProvider(),
                target.getRole(),
                target.getCreatedAt(),
                target.getUpdatedAt(),
                target.getLastLoginAt(),
                presenceResponse(presence),
                sessions.stream().map(AdminAccountService::sessionResponse).toList(),
                actions(actor, target, presence, lastAdmin)
        );
    }

    @Transactional
    public void forceSignOut(User actor, String userId) {
        User target = userRepository.findByIdForUpdate(userId).orElseThrow(AdminAccountService::notFound);
        Instant now = clock.instant();
        target.setCredentialsValidAfter(now);
        userRepository.save(target);
        refreshTokenService.revokeAllForUser(target.getId());
        audit(actor, target, AdminAuditAction.FORCE_SIGN_OUT, null, now);
        eventPublisher.publishEvent(new AdminAccountSignedOutEvent(target.getId(), false));
    }

    @Transactional
    public AdminAccountDetailResponse changeRole(User actor,
                                                  String userId,
                                                  String requestedRole,
                                                  String confirmedUsername) {
        Role newRole = parseRole(requestedRole);
        List<User> lockedAdmins = userRepository.findAllByRoleForUpdate(Role.ADMIN);
        User target = userRepository.findByIdForUpdate(userId).orElseThrow(AdminAccountService::notFound);
        confirmUsername(target, confirmedUsername);

        if (actor.getId().equals(target.getId())) {
            throw new ExceptionResponse(HttpStatus.CONFLICT, "Administrators cannot change their own role");
        }
        if (target.getAuthProvider() != AuthProvider.LOCAL) {
            throw new ExceptionResponse(HttpStatus.CONFLICT, "Guest accounts cannot be administrators");
        }
        if (target.getRole() == Role.ADMIN && newRole != Role.ADMIN && lockedAdmins.size() <= 1) {
            throw new ExceptionResponse(HttpStatus.CONFLICT, "The final administrator cannot be demoted");
        }
        if (target.getRole() == newRole) {
            return detail(actor, target.getId());
        }

        Role oldRole = target.getRole();
        Instant now = clock.instant();
        target.setRole(newRole);
        if (oldRole == Role.ADMIN && newRole != Role.ADMIN) {
            target.setCredentialsValidAfter(now);
            refreshTokenService.revokeAllForUser(target.getId());
            eventPublisher.publishEvent(new AdminAccountSignedOutEvent(target.getId(), false));
        }
        userRepository.save(target);
        audit(actor, target, AdminAuditAction.ROLE_CHANGED, oldRole + " -> " + newRole, now);

        return detail(actor, target.getId());
    }

    @Transactional
    public void delete(User actor, String userId, String confirmedUsername) {
        List<User> lockedAdmins = userRepository.findAllByRoleForUpdate(Role.ADMIN);
        User target = userRepository.findByIdForUpdate(userId).orElseThrow(AdminAccountService::notFound);
        confirmUsername(target, confirmedUsername);

        if (actor.getId().equals(target.getId())) {
            throw new ExceptionResponse(HttpStatus.CONFLICT, "Administrators cannot delete themselves");
        }
        if (target.getRole() == Role.ADMIN && lockedAdmins.size() <= 1) {
            throw new ExceptionResponse(HttpStatus.CONFLICT, "The final administrator cannot be deleted");
        }

        UserPresence presence = presenceService.getUserPresence(target.getId());
        if (isAttached(presence)) {
            throw new ExceptionResponse(HttpStatus.CONFLICT, "Accounts in a lobby or game cannot be deleted");
        }

        Instant now = clock.instant();
        audit(actor, target, AdminAuditAction.ACCOUNT_DELETED,
                "provider=" + target.getAuthProvider() + ", role=" + target.getRole(), now);
        refreshTokenRepository.deleteByUserIdIn(List.of(target.getId()));
        userRepository.delete(target);
        eventPublisher.publishEvent(new AdminAccountSignedOutEvent(target.getId(), true));
    }

    private Specification<User> filters(String query,
                                        String accountType,
                                        String activity,
                                        String roleValue,
                                        AccountCursor cursor,
                                        Set<String> activeUserIds) {
        return (root, criteriaQuery, builder) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (query != null && !query.isBlank()) {
                String escaped = query.trim().toLowerCase(Locale.ROOT)
                        .replace("\\", "\\\\")
                        .replace("%", "\\%")
                        .replace("_", "\\_");
                String pattern = "%" + escaped + "%";
                predicates.add(builder.or(
                        builder.like(builder.lower(root.get("username")), pattern, '\\'),
                        builder.like(builder.lower(root.get("email")), pattern, '\\'),
                        builder.like(builder.lower(root.get("id")), pattern, '\\')
                ));
            }

            AuthProvider provider = parseProviderFilter(accountType);
            if (provider != null) {
                predicates.add(builder.equal(root.get("authProvider"), provider));
            }
            Role role = parseOptionalRole(roleValue);
            if (role != null) {
                predicates.add(builder.equal(root.get("role"), role));
            }

            String normalizedActivity = normalizeFilter(activity);
            if ("ACTIVE".equals(normalizedActivity)) {
                predicates.add(activeUserIds.isEmpty()
                        ? builder.disjunction()
                        : root.get("id").in(activeUserIds));
            } else if ("INACTIVE".equals(normalizedActivity) && !activeUserIds.isEmpty()) {
                predicates.add(builder.not(root.get("id").in(activeUserIds)));
            } else if (!"ALL".equals(normalizedActivity)) {
                throw new ExceptionResponse(HttpStatus.BAD_REQUEST, "Unknown activity filter");
            }

            if (cursor != null) {
                predicates.add(builder.or(
                        builder.lessThan(root.get("createdAt"), cursor.createdAt()),
                        builder.and(
                                builder.equal(root.get("createdAt"), cursor.createdAt()),
                                builder.lessThan(root.get("id"), cursor.userId())
                        )
                ));
            }
            return builder.and(predicates.toArray(Predicate[]::new));
        };
    }

    private Map<String, Long> liveSessionCounts() {
        Map<String, Long> counts = new HashMap<>();
        sessionRepository.findAll().forEach(session -> {
            if (session.getUserId() != null) {
                counts.merge(session.getUserId(), 1L, Long::sum);
            }
        });
        return counts;
    }

    private AdminAccountSummaryResponse summary(User user, long sessionCount) {
        UserPresence presence = presenceService.getUserPresence(user.getId());
        return new AdminAccountSummaryResponse(
                user.getId(), user.getUsername(), user.getEmail(), user.getAuthProvider(), user.getRole(),
                user.getCreatedAt(), user.getLastLoginAt(), sessionCount > 0, sessionCount,
                presence == null ? PresenceStatus.OFFLINE : presence.getStatus()
        );
    }

    private static AdminAccountPresenceResponse presenceResponse(UserPresence presence) {
        return presence == null
                ? new AdminAccountPresenceResponse(PresenceStatus.OFFLINE, null, null, null)
                : new AdminAccountPresenceResponse(
                        presence.getStatus(), presence.getLastPing(), presence.getLobbyId(), presence.getGameId());
    }

    private static AdminAccountSessionResponse sessionResponse(UserSession session) {
        String ipAddress = session.getMetadata() == null ? null : session.getMetadata().getIpAddress();
        String userAgent = session.getMetadata() == null ? null : session.getMetadata().getUserAgent();
        return new AdminAccountSessionResponse(
                session.getId(), session.isActive(), session.getCreatedAt(), ipAddress, userAgent);
    }

    private AdminAccountActionsResponse actions(User actor, User target, UserPresence presence, boolean lastAdmin) {
        boolean self = actor.getId().equals(target.getId());
        String roleReason = self
                ? "You cannot change your own role"
                : target.getAuthProvider() == AuthProvider.ANONYMOUS
                        ? "Guest accounts cannot change role"
                        : lastAdmin ? "The final administrator cannot be demoted" : null;
        String deleteReason = self
                ? "You cannot delete your own account"
                : lastAdmin
                        ? "The final administrator cannot be deleted"
                        : isAttached(presence) ? "The account is currently in a lobby or game" : null;
        return new AdminAccountActionsResponse(!self, roleReason == null, deleteReason == null,
                roleReason, deleteReason);
    }

    private void audit(User actor,
                       User target,
                       AdminAuditAction action,
                       String details,
                       Instant createdAt) {
        AdminAuditLog entry = new AdminAuditLog();
        entry.setActorUserId(actor.getId());
        entry.setActorUsername(actor.getUsername());
        entry.setTargetUserId(target.getId());
        entry.setTargetUsername(target.getUsername());
        entry.setTargetEmail(target.getEmail());
        entry.setAction(action);
        entry.setDetails(details);
        entry.setCreatedAt(createdAt);
        auditLogRepository.save(entry);
    }

    private User requireUser(String userId) {
        return userRepository.findById(userId).orElseThrow(AdminAccountService::notFound);
    }

    private static void confirmUsername(User target, String confirmedUsername) {
        if (!target.getUsername().equals(confirmedUsername)) {
            throw new ExceptionResponse(HttpStatus.BAD_REQUEST, "Username confirmation does not match");
        }
    }

    private static boolean isAttached(UserPresence presence) {
        return presence != null && (presence.getLobbyId() != null || presence.getGameId() != null);
    }

    private static ExceptionResponse notFound() {
        return new ExceptionResponse(HttpStatus.NOT_FOUND, "Account not found");
    }

    private static Role parseRole(String value) {
        Role role = parseOptionalRole(value);
        if (role == null) {
            throw new ExceptionResponse(HttpStatus.BAD_REQUEST, "Role is required");
        }
        return role;
    }

    private static Role parseOptionalRole(String value) {
        if (value == null || value.isBlank() || "ALL".equalsIgnoreCase(value)) {
            return null;
        }
        try {
            return Role.valueOf(value.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new ExceptionResponse(HttpStatus.BAD_REQUEST, "Unknown role");
        }
    }

    private static AuthProvider parseProviderFilter(String value) {
        String normalized = normalizeFilter(value);
        return switch (normalized) {
            case "ALL" -> null;
            case "REGISTERED", "LOCAL" -> AuthProvider.LOCAL;
            case "GUEST", "ANONYMOUS" -> AuthProvider.ANONYMOUS;
            default -> throw new ExceptionResponse(HttpStatus.BAD_REQUEST, "Unknown account type filter");
        };
    }

    private static String normalizeFilter(String value) {
        return value == null || value.isBlank() ? "ALL" : value.toUpperCase(Locale.ROOT);
    }

    private static String encodeCursor(User user) {
        String raw = user.getCreatedAt() + "|" + user.getId();
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    private static AccountCursor decodeCursor(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            String raw = new String(Base64.getUrlDecoder().decode(value), StandardCharsets.UTF_8);
            int separator = raw.indexOf('|');
            if (separator <= 0 || separator == raw.length() - 1) {
                throw new IllegalArgumentException("Malformed cursor");
            }
            return new AccountCursor(Instant.parse(raw.substring(0, separator)), raw.substring(separator + 1));
        } catch (IllegalArgumentException exception) {
            throw new ExceptionResponse(HttpStatus.BAD_REQUEST, "Invalid account cursor");
        }
    }

    private record AccountCursor(Instant createdAt, String userId) {}
}
