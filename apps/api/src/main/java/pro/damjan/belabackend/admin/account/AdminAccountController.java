package pro.damjan.belabackend.admin.account;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import pro.damjan.belabackend.admin.dto.request.AdminChangeRoleRequest;
import pro.damjan.belabackend.admin.dto.request.AdminDeleteAccountRequest;
import pro.damjan.belabackend.admin.dto.response.AdminAccountDetailResponse;
import pro.damjan.belabackend.admin.dto.response.AdminAccountPageResponse;
import pro.damjan.belabackend.user.User;

@RestController
@RequestMapping("/admin/accounts")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAccountController {
    private final AdminAccountService accountService;

    public AdminAccountController(AdminAccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping
    public AdminAccountPageResponse list(
            @RequestParam(required = false) String query,
            @RequestParam(defaultValue = "ALL") String accountType,
            @RequestParam(defaultValue = "ALL") String activity,
            @RequestParam(defaultValue = "ALL") String role,
            @RequestParam(required = false) String cursor) {
        return accountService.list(query, accountType, activity, role, cursor);
    }

    @GetMapping("/{id}")
    public AdminAccountDetailResponse detail(@AuthenticationPrincipal User actor,
                                             @PathVariable String id) {
        return accountService.detail(actor, id);
    }

    @PostMapping("/{id}/force-sign-out")
    public ResponseEntity<Void> forceSignOut(@AuthenticationPrincipal User actor,
                                             @PathVariable String id) {
        accountService.forceSignOut(actor, id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/role")
    public AdminAccountDetailResponse changeRole(@AuthenticationPrincipal User actor,
                                                  @PathVariable String id,
                                                  @Valid @RequestBody AdminChangeRoleRequest request) {
        return accountService.changeRole(actor, id, request.getRole(), request.getConfirmUsername());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal User actor,
                                       @PathVariable String id,
                                       @Valid @RequestBody AdminDeleteAccountRequest request) {
        accountService.delete(actor, id, request.getConfirmUsername());
        return ResponseEntity.noContent().build();
    }
}
