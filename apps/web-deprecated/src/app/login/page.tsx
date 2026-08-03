import AuthPage from "@/components/pages/auth/auth-page";
import LoginForm from "@/components/pages/auth/login-form";

export default function Login() {
    return (
        <AuthPage
            className="flex flex-col items-center justify-center"
            eyebrow="Where champions play"
            headline="Play the game you love, at the highest level.">
            <LoginForm />
        </AuthPage>
    );
}
