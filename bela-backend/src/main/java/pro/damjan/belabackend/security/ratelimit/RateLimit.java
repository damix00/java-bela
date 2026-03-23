package pro.damjan.belabackend.security.ratelimit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimit {
    String keyPrefix() default "";
    Limit user() default @Limit(enabled = false);
    Limit ip()   default @Limit(enabled = false);

    @interface Limit {
        int limit() default 60;
        int windowSeconds() default 60;
        boolean enabled() default true;
        boolean limitSuccess() default true;
    }
}