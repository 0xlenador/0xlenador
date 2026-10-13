import socialsData from "./socials.json"

export interface SocialChannel {
  id: string
  name: string
  handle: string
  url: string
  status: "active" | "soon"
}

export type SocialKey = keyof typeof socialsData

export const socials = socialsData as Record<SocialKey, SocialChannel>

/**
 * URLs oficiales activas para Schema.org sameAs (SEO)
 */
export const sameAsSocialUrls: string[] = Object.values(socials)
  .filter((item) => item.status === "active" && item.url !== "#")
  .map((item) => item.url)
