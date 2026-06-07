import getReadingTime from "reading-time"
import { toString } from "mdast-util-to-string"

export function remarkReadingTime() {
  return function (tree, { data }) {
    const textOnPage = toString(tree)
    const readingTime = getReadingTime(textOnPage)
    // readingTime.minutes es un número (ej. 2.5), lo redondeamos hacia arriba
    const minutes = Math.max(1, Math.ceil(readingTime.minutes))
    data.astro.frontmatter.readTime = `${minutes} min`
  }
}
