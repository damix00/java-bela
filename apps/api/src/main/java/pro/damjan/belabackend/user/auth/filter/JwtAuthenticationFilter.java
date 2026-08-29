package pro.damjan.belabackend.user.auth.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import pro.damjan.belabackend.security.jwt.AuthErrorWriter;
import pro.damjan.belabackend.security.jwt.JwtAuthException;
import pro.damjan.belabackend.security.jwt.JwtService;
import pro.damjan.belabackend.security.jwt.TokenError;

import java.io.IOException;

@Component
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;
    private final AuthErrorWriter authErrorWriter;

    // @Lazy is needed to avoid circular dependency with JwtService
    @Lazy
    public JwtAuthenticationFilter(JwtService jwtService,
                                   UserDetailsService userDetailsService,
                                   AuthErrorWriter authErrorWriter) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.authErrorWriter = authErrorWriter;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();

        // /auth/refresh and /auth/logout deliberately run without an access token
        return (path.startsWith("/auth") && !path.equals("/auth/me") && !path.equals("/auth/logout-all"))
                || path.startsWith("/ws")
                || path.startsWith("/actuator");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            // Let the entry point decide: the route may not need authentication at all
            filterChain.doFilter(request, response);
            return;
        }

        String userId;
        UserDetails userDetails;
        try {
            userId = jwtService.parseAccessToken(authHeader.substring(7));
            userDetails = userDetailsService.loadUserByUsername(userId);
        } catch (JwtAuthException e) {
            // TOKEN_EXPIRED is the signal the client keys refresh-and-retry on, so it has to
            // be distinguishable from a token that will never work
            String code = e.getError() == TokenError.EXPIRED ? "TOKEN_EXPIRED" : "TOKEN_INVALID";
            authErrorWriter.write(response, HttpStatus.UNAUTHORIZED, code, e.getMessage());
            return;
        } catch (UsernameNotFoundException e) {
            // A guest whose account was swept away still holds a signed token
            authErrorWriter.write(response, HttpStatus.UNAUTHORIZED, "USER_GONE", "User no longer exists");
            return;
        }

        if (SecurityContextHolder.getContext().getAuthentication() == null) {
            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    userDetails,
                    null,
                    userDetails.getAuthorities()
            );

            SecurityContextHolder.getContext().setAuthentication(authToken);
        }

        // RateLimitInterceptor reads this to apply per-user limits
        request.setAttribute("userId", userId);

        filterChain.doFilter(request, response);
    }

}
