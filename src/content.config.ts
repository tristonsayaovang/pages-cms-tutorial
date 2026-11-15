import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Each Markdown file in src/content/posts becomes one post.
// The frontmatter fields below must match the fields you define in .pages.yml.
const posts = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		description: z.string().optional(),
		// Pages CMS may write an empty string when no image is picked
		cover: z.string().nullish(),
		draft: z.boolean().default(false),
	}),
});

export const collections = { posts };
