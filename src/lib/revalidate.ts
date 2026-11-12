import { revalidatePath } from 'next/cache';

/**
 * Invalidate public catalog pages (home, galleries, and album detail pages)
 * immediately after any admin mutation.
 */
export function revalidateCatalogPages(albumSlugs: string[] = []): void {
  revalidatePath('/');
  revalidatePath('/galleries');
  revalidatePath('/album/[slug]', 'page');

  for (const slug of albumSlugs) {
    if (slug) {
      revalidatePath(`/album/${slug}`);
    }
  }
}

/**
 * Invalidate the homepage when announcements or FAQs change.
 */
export function revalidateHomePage(): void {
  revalidatePath('/');
}
