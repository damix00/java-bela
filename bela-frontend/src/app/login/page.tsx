import AuthPage from "@/components/pages/auth/auth-page";
import LoginForm from "@/components/pages/auth/login-form";

export default function Login() {
    return (
        <AuthPage className="flex flex-col items-center justify-center">
            <LoginForm />
        </AuthPage>
    );
}
