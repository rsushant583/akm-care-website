import { useEffect, useState } from "react";
import {
  FALLBACK_PUBLIC_CONTACT,
  loadPublicContact,
  type PublicContactInfo,
  buildPublicContact,
} from "@/lib/storefront/publicContact";

const initial: PublicContactInfo = buildPublicContact({});

/**
 * Loads public contact from site_settings once; falls back to approved constants.
 */
export function usePublicContact(): PublicContactInfo {
  const [info, setInfo] = useState<PublicContactInfo>(initial);

  useEffect(() => {
    let cancelled = false;
    void loadPublicContact().then((next) => {
      if (!cancelled) setInfo(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return info;
}

export { FALLBACK_PUBLIC_CONTACT };
