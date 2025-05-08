import { AuthForm } from "@/components/ui/AuthForm";
import { LoggedInProfile } from "@/components/ui/LoggedInProfile";
import { useUserStore } from "@/store/useUserStore";

export default function Profile() {
  const user = useUserStore((state) => state.user);
  const isUserLoggedIn = Boolean(user);

  return isUserLoggedIn ? <LoggedInProfile /> : <AuthForm />;
}
