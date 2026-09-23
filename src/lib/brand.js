/** Black D — light UI. White D — dark UI. Splash/auth keep the wordmark. */
export const BRAND_LOGO_MARK_LIGHT = "/delta_logo.png";
export const BRAND_LOGO_MARK_DARK = "/delta_logo-light.png";

export function brandLogoMarkSrc(isLight) {
  return isLight ? BRAND_LOGO_MARK_LIGHT : BRAND_LOGO_MARK_DARK;
}
