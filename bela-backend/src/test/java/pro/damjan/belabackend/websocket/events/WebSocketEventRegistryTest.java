package pro.damjan.belabackend.websocket.events;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.support.DefaultListableBeanFactory;
import org.springframework.beans.factory.support.GenericBeanDefinition;
import org.springframework.context.support.GenericApplicationContext;
import org.springframework.web.socket.WebSocketSession;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class WebSocketEventRegistryTest {

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = JsonMapper
                .builder()
                .changeDefaultPropertyInclusion(inc -> inc.withValueInclusion(JsonInclude.Include.ALWAYS))
                .build();
    }

    private WebSocketEventRegistry createRegistry(Object... beans) {
        GenericApplicationContext ctx = new GenericApplicationContext();
        DefaultListableBeanFactory factory = ctx.getDefaultListableBeanFactory();
        for (int i = 0; i < beans.length; i++) {
            String name = "bean" + i;
            GenericBeanDefinition bd = new GenericBeanDefinition();
            bd.setBeanClass(beans[i].getClass());
            factory.registerBeanDefinition(name, bd);
            // Replace the bean definition's instance with our pre-built object
            factory.registerSingleton(name, beans[i]);
        }
        ctx.refresh();

        WebSocketEventRegistry registry = new WebSocketEventRegistry(ctx, objectMapper);
        registry.afterSingletonsInstantiated();
        return registry;
    }

    private WebSocketSession mockSession(String userId) {
        WebSocketSession session = mock(WebSocketSession.class);
        Map<String, Object> attrs = new HashMap<>();
        attrs.put("userId", userId);
        when(session.getAttributes()).thenReturn(attrs);
        return session;
    }

    // --- Test handler beans ---

    public static class SimpleHandler {
        boolean called = false;
        WebSocketSession receivedSession;

        @OnEvent("ping")
        public void onPing(WebSocketSession session) {
            called = true;
            receivedSession = session;
        }
    }

    public static class NullSafeDtoHandler {
        PlayCardDto receivedDto;
        boolean called = false;

        @OnEvent("nullSafe")
        public void onEvent(WebSocketSession session, PlayCardDto dto) {
            called = true;
            receivedDto = dto;
        }
    }

    public static class DtoHandler {
        String receivedCardId;
        WebSocketSession receivedSession;

        @OnEvent("playCard")
        public void onPlayCard(WebSocketSession session, PlayCardDto dto) {
            receivedSession = session;
            receivedCardId = dto.cardId;
        }
    }

    public static class PlayCardDto {
        public String cardId;
    }

    public static class RawJsonHandler {
        JsonNode receivedBody;

        @OnEvent("raw")
        public void onRaw(WebSocketSession session, JsonNode body) {
            receivedBody = body;
        }
    }

    public static class BodyOnlyHandler {
        String receivedValue;

        @OnEvent("bodyOnly")
        public void onBodyOnly(BodyDto dto) {
            receivedValue = dto.value;
        }
    }

    public static class BodyDto {
        public String value;
    }

    public static class ThrowingHandler {
        @OnEvent("fail")
        public void onFail(WebSocketSession session) {
            throw new RuntimeException("handler error");
        }
    }

    public static class DuplicateHandlerA {
        @OnEvent("dup")
        public void onDup() {}
    }

    public static class DuplicateHandlerB {
        @OnEvent("dup")
        public void onDup() {}
    }

    public static class NoAnnotationHandler {
        public void notAnEvent(WebSocketSession session) {}
    }

    public static class MultipleEventsHandler {
        boolean pingCalled = false;
        boolean pongCalled = false;

        @OnEvent("ping2")
        public void onPing() { pingCalled = true; }

        @OnEvent("pong2")
        public void onPong() { pongCalled = true; }
    }

    // --- Tests ---

    @Nested
    class Registration {

        @Test
        void registersAnnotatedMethods() {
            SimpleHandler handler = new SimpleHandler();
            WebSocketEventRegistry registry = createRegistry(handler);

            // Should not throw — "ping" is registered
            assertDoesNotThrow(() -> registry.dispatch(mockSession("u1"), "ping", null));
            assertTrue(handler.called);
        }

        @Test
        void ignoresMethodsWithoutAnnotation() {
            NoAnnotationHandler handler = new NoAnnotationHandler();
            WebSocketEventRegistry registry = createRegistry(handler);

            // "notAnEvent" should not be registered, dispatch should just warn
            assertDoesNotThrow(() -> registry.dispatch(mockSession("u1"), "notAnEvent", null));
        }

        @Test
        void registersMultipleEventsFromSameBean() throws Exception {
            MultipleEventsHandler handler = new MultipleEventsHandler();
            WebSocketEventRegistry registry = createRegistry(handler);

            registry.dispatch(mockSession("u1"), "ping2", null);
            assertTrue(handler.pingCalled);
            assertFalse(handler.pongCalled);

            registry.dispatch(mockSession("u1"), "pong2", null);
            assertTrue(handler.pongCalled);
        }

        @Test
        void throwsOnDuplicateEventName() {
            DuplicateHandlerA a = new DuplicateHandlerA();
            DuplicateHandlerB b = new DuplicateHandlerB();

            assertThrows(IllegalStateException.class, () -> createRegistry(a, b));
        }
    }

    @Nested
    class Dispatch {

        @Test
        void dispatchesWithSessionOnly() throws Exception {
            SimpleHandler handler = new SimpleHandler();
            WebSocketEventRegistry registry = createRegistry(handler);
            WebSocketSession session = mockSession("user-1");

            registry.dispatch(session, "ping", null);

            assertTrue(handler.called);
            assertSame(session, handler.receivedSession);
        }

        @Test
        void dispatchesWithDtoBody() throws Exception {
            DtoHandler handler = new DtoHandler();
            WebSocketEventRegistry registry = createRegistry(handler);
            WebSocketSession session = mockSession("user-1");
            JsonNode body = objectMapper.readTree("{\"cardId\":\"7H\"}");

            registry.dispatch(session, "playCard", body);

            assertSame(session, handler.receivedSession);
            assertEquals("7H", handler.receivedCardId);
        }

        @Test
        void dispatchesWithRawJsonNode() throws Exception {
            RawJsonHandler handler = new RawJsonHandler();
            WebSocketEventRegistry registry = createRegistry(handler);
            WebSocketSession session = mockSession("user-1");
            JsonNode body = objectMapper.readTree("{\"key\":\"val\"}");

            registry.dispatch(session, "raw", body);

            assertNotNull(handler.receivedBody);
            assertEquals("val", handler.receivedBody.get("key").asText());
        }

        @Test
        void dispatchesWithBodyOnlyNoSession() throws Exception {
            BodyOnlyHandler handler = new BodyOnlyHandler();
            WebSocketEventRegistry registry = createRegistry(handler);
            JsonNode body = objectMapper.readTree("{\"value\":\"hello\"}");

            registry.dispatch(mockSession("u1"), "bodyOnly", body);

            assertEquals("hello", handler.receivedValue);
        }

        @Test
        void dispatchWithNullBodySetsDtoToNull() throws Exception {
            NullSafeDtoHandler handler = new NullSafeDtoHandler();
            WebSocketEventRegistry registry = createRegistry(handler);
            WebSocketSession session = mockSession("user-1");

            registry.dispatch(session, "nullSafe", null);

            assertTrue(handler.called);
            assertNull(handler.receivedDto);
        }

        @Test
        void unknownEventDoesNotThrow() {
            SimpleHandler handler = new SimpleHandler();
            WebSocketEventRegistry registry = createRegistry(handler);

            assertDoesNotThrow(() -> registry.dispatch(mockSession("u1"), "nonexistent", null));
            assertFalse(handler.called);
        }
    }

    @Nested
    class ErrorHandling {

        @Test
        void handlerExceptionPropagatesAsInvocationTargetException() {
            ThrowingHandler handler = new ThrowingHandler();
            WebSocketEventRegistry registry = createRegistry(handler);

            Exception ex = assertThrows(Exception.class,
                    () -> registry.dispatch(mockSession("u1"), "fail", null));

            // The RuntimeException from the handler is wrapped in InvocationTargetException
            Throwable cause = ex.getCause();
            assertNotNull(cause);
            assertEquals("handler error", cause.getMessage());
        }

        @Test
        void malformedBodyThrowsDeserializationError() {
            DtoHandler handler = new DtoHandler();
            WebSocketEventRegistry registry = createRegistry(handler);
            JsonNode body = objectMapper.readTree("\"not-an-object\"");

            assertThrows(Exception.class,
                    () -> registry.dispatch(mockSession("u1"), "playCard", body));
        }
    }

    @Nested
    class RCESecurity {

        /**
         * Polymorphic type attacks: a malicious payload tries to force Jackson
         * to instantiate an arbitrary class via @type / @class. By default,
         * Jackson does NOT enable default typing, so this must be rejected.
         */
        @Test
        void rejectsPolymorphicTypeAttack() {
            DtoHandler handler = new DtoHandler();
            WebSocketEventRegistry registry = createRegistry(handler);

            // Attempt a classic Jackson polymorphic deserialization attack
            String malicious = """
                {
                  "@type": "java.lang.Runtime",
                  "cardId": "exploit"
                }
                """;
            JsonNode body = objectMapper.readTree(malicious);

            // Should either ignore @type (deserialise as PlayCardDto) or throw — never instantiate Runtime
            assertDoesNotThrow(() -> registry.dispatch(mockSession("u1"), "playCard", body));
            // The cardId should be the safe value, proving @type was ignored
            assertEquals("exploit", handler.receivedCardId);
        }

        @Test
        void rejectsClassPropertyAttack() {
            DtoHandler handler = new DtoHandler();
            WebSocketEventRegistry registry = createRegistry(handler);

            String malicious = """
                {
                  "@class": "java.lang.ProcessBuilder",
                  "cardId": "pwned"
                }
                """;
            JsonNode body = objectMapper.readTree(malicious);

            assertDoesNotThrow(() -> registry.dispatch(mockSession("u1"), "playCard", body));
            assertEquals("pwned", handler.receivedCardId);
        }

        /**
         * Even if someone sends a nested polymorphic payload, treeToValue
         * deserialises into the concrete DTO class — no polymorphic resolution.
         */
        @Test
        void rejectsNestedPolymorphicAttack() {
            RawJsonHandler handler = new RawJsonHandler();
            WebSocketEventRegistry registry = createRegistry(handler);

            String malicious = """
                {
                  "nested": {
                    "@type": "java.lang.Runtime"
                  }
                }
                """;
            JsonNode body = objectMapper.readTree(malicious);

            // Raw JsonNode handler — just stores it, no deserialization exploit
            assertDoesNotThrow(() -> registry.dispatch(mockSession("u1"), "raw", body));
            assertNotNull(handler.receivedBody);
        }

        @Test
        void treeToValueUsesConcreteTypeNotPolymorphic() {
            DtoHandler handler = new DtoHandler();
            WebSocketEventRegistry registry = createRegistry(handler);

            // Attempt to use Jackson's default typing class hints
            String[] attacks = {
                    "{\"@type\":\"java.lang.Thread\",\"cardId\":\"x\"}",
                    "{\"@class\":\"java.lang.Thread\",\"cardId\":\"x\"}",
                    "{\"class\":\"java.lang.Thread\",\"cardId\":\"x\"}",
            };

            for (String attack : attacks) {
                JsonNode body = objectMapper.readTree(attack);
                assertDoesNotThrow(() -> registry.dispatch(mockSession("u1"), "playCard", body));
                // Always deserialised as PlayCardDto, never as Thread/Runtime/etc
                assertEquals("x", handler.receivedCardId,
                        "Attack payload should be safely deserialized as DTO: " + attack);
            }
        }

        /**
         * Verify the ObjectMapper does NOT have default typing enabled,
         * which is the main vector for Jackson RCE gadgets.
         */
        @Test
        void objectMapperDefaultTypingIsDisabled() {
            // If default typing were enabled, deserializing with @type would resolve to the named class.
            // We verify by deserializing into Object.class — with default typing OFF, this yields a Map.
            String json = "{\"@type\":\"java.lang.Runtime\",\"value\":\"test\"}";
            Object result = objectMapper.readValue(json, Object.class);

            // Should be a plain Map, not a Runtime instance
            assertInstanceOf(Map.class, result);
            assertFalse(result instanceof Runtime);
        }
    }
}

