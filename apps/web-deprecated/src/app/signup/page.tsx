import AuthPage from "@/components/pages/auth/auth-page";
import SignupForm from "@/components/pages/auth/signup-form";

export default function Signup() {
    return (
        <AuthPage
            className="flex flex-col items-center justify-center"
            eyebrow="Join the community"
            headline="Create your account and start playing today."
            patternVariant="primary">
            <SignupForm />
        </AuthPage>
    );
}
