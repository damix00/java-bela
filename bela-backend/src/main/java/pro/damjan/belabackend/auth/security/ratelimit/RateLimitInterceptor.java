package pro.damjan.belabackend.auth.security.ratelimit;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.BucketConfiguration;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.HandlerMethod;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class RateLimitInterceptor implements HandlerInterceptor {

    private final RateLimitService rateLimitService;
    private final InternalSourceService internalSourceService;

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws Exception {

        if (!(handler instanceof HandlerMethod method)) return true;

        RateLimit annotation = method.getMethodAnnotation(RateLimit.class);
        if (annotation == null) return true;

        if (internalSourceService.isInternalSource(request.getHeader(InternalSourceService.INTERNAL_SOURCE_HEADER))) {
            log.info("Bypassing rate limit for internal source");
            return true;
        }

        if (annotation.ip().enabled()) {
            String ipKey = annotation.keyPrefix() + ":ip:" + request.getRemoteAddr();
            if (!checkLimit(ipKey, annotation.ip(), request, response)) {
                return false;
            }
        }

        if (annotation.user().enabled()) {
            String userId = (String) request.getAttribute("userId");
            if (userId != null) {
                String userKey = annotation.keyPrefix() + ":user:" + userId;
                if (!checkLimit(userKey, annotation.user(), request, response)) {
                    return false;
                }
            }
        }

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        if (response.getStatus() >= 200 && response.getStatus() < 300) {
            List<Runnable> restorers = (List<Runnable>) request.getAttribute("rateLimitRestorers");
            if (restorers != null) {
                restorers.forEach(Runnable::run);
            }
        }
    }

    private boolean checkLimit(String key, RateLimit.Limit limit, HttpServletRequest request, HttpServletResponse response) throws Exception {
        BucketConfiguration config = BucketConfiguration.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(limit.limit())
                        .refillGreedy(limit.limit(), Duration.ofSeconds(limit.windowSeconds()))
                        .build())
                .build();

        ConsumptionProbe probe = rateLimitService.consume(key, config);

        if (probe.isConsumed() && !limit.limitSuccess()) {
            List<Runnable> restorers = (List<Runnable>) request.getAttribute("rateLimitRestorers");
            if (restorers == null) {
                restorers = new ArrayList<>();
                request.setAttribute("rateLimitRestorers", restorers);
            }
            restorers.add(() -> rateLimitService.restore(key, config));
        }

        response.setHeader("X-Rate-Limit-Remaining",
                String.valueOf(probe.getRemainingTokens()));

        if (!probe.isConsumed()) {
            long retryAfter = TimeUnit.NANOSECONDS.toSeconds(probe.getNanosToWaitForRefill());
            response.setStatus(429);
            response.setHeader("Retry-After", String.valueOf(retryAfter));
            response.getWriter().write("{\"error\":\"Too many requests\"}");
            return false;
        }

        return true;
    }
}