"use client";

import { useParams } from "next/navigation";

import { ButtonLink } from "@/components/controls/Button";
import AccountPage from "@/components/layout/AccountPage";
import type { Dictionary } from "@/dictionaries";
import { defaultLocale, isLocale, type Locale } from "@/lib/i18n/config";
import { homePath } from "@/lib/navigation/routes";

type NotFoundCopy = Dictionary["profile"]["notFound"];

type ProfileNotFoundScreenProps = {
    copy: Record<Locale, NotFoundCopy>;
};

/** Chooses copy from the active dynamic route because not-found files get no params. */
export default function ProfileNotFoundScreen({
    copy,
}: ProfileNotFoundScreenProps) {
    const params = useParams<{ lang?: string }>();
    const requestedLocale = params.lang;
    const locale: Locale =
        requestedLocale && isLocale(requestedLocale)
            ? requestedLocale
            : defaultLocale;

    return (
        <AccountPage
            heading={copy[locale].heading}
            intro={copy[locale].body}
            action={
                <ButtonLink
                    surface="felt"
                    href={homePath(locale)}
                    tone="cream"
                    size="sm"
                >
                    {copy[locale].action}
                </ButtonLink>
            }
        >
            {null}
        </AccountPage>
    );
}
