# Adding Pages CMS to this site, step by step

This guide adds [Pages CMS](https://pagescms.org) to this small Astro blog.
Do the steps in order. Each step ends with a check so you can tell it worked.

---

## How Pages CMS works

Pages CMS is a **Git-based CMS**. It has no database of its own for your content:

```
 You in the browser            Pages CMS                 GitHub repo              Your site
┌──────────────────┐  edits  ┌──────────────┐  commits ┌──────────────┐ build ┌───────────┐
│ app.pagescms.org │ ──────► │ reads         │ ───────► │ .md / .json  │ ────► │ Astro     │
│ forms & editor   │         │ .pages.yml    │          │ files        │       │ HTML      │
└──────────────────┘         └──────────────┘          └──────────────┘       └───────────┘
```

1. Your content is ordinary files in your repo: Markdown posts and a JSON settings file.
2. A file named **`.pages.yml`** at the repo root describes those files: where they are and
   which fields they have.
3. Pages CMS reads `.pages.yml` and builds editing forms from it.
4. When you click **Save**, Pages CMS **makes a Git commit** to your GitHub repo.
5. Your site rebuilds from the new files. Locally that means `git pull`; in production a host
   like Netlify or Vercel rebuilds on every push.

The key idea: **`.pages.yml` describes your content for the editor, and `src/content.config.ts`
describes the same content for Astro.** Keep the two in sync.

---

## Step 0: Look around the template

```bash
npm run dev          # or: astro dev --background
```

Open http://localhost:4321. Then look at these files:

| File | What it is | Pages CMS will edit it as… |
|---|---|---|
| `src/data/site.json` | Site title, tagline, author, footer | a **file** (one form) |
| `src/content/posts/*.md` | Blog posts: frontmatter and Markdown body | a **collection** (a list of entries) |
| `public/images/` | Images | the **media** library |
| `src/content.config.ts` | Astro's schema for posts | (Pages CMS doesn't read this) |

Open `src/content/posts/2026-11-01-hello-world.md`. The fields between the `---` lines
(`title`, `date`, `description`, `cover`, `draft`) are the **frontmatter**. Everything below
them is the **body**. You'll map both to Pages CMS fields.

✅ **Check:** the home page shows 2 posts. The third post is a draft, so it's hidden.

---

## Step 1: Put the project on GitHub

Pages CMS works through GitHub, so the project needs to be a GitHub repo.

```bash
git init
git add .
git commit -m "Initial Astro blog"
```

Create an **empty** repo on GitHub, e.g. `pages-cms-tutorial`. Then:

```bash
git branch -M main
git remote add origin git@github.com:<your-username>/pages-cms-tutorial.git
git push -u origin main
```

✅ **Check:** your files show up on github.com.

---

## Step 2: Create a minimal `.pages.yml`

Start small: just the media folder and the site-settings file. Create `.pages.yml` in the
project root (next to `package.json`):

```yaml
media:
  input: public/images   # where uploaded files are saved in the repo
  output: /images        # the URL path written into your content

content:
  - name: site
    label: Site settings
    type: file                 # one file = one form
    path: src/data/site.json
    format: json
    fields:
      - name: title
        label: Site title
        type: string
        required: true
      - name: tagline
        label: Tagline
        type: string
      - name: author
        label: Author
        type: string
      - name: footer
        label: Footer text
        type: text             # multi-line
```

Here is what each part does:

- **`media.input` vs `media.output`**: an image uploaded as `cat.png` is saved to
  `public/images/cat.png` in the repo, but the content stores `/images/cat.png`. That path is
  where Astro serves files from `public/`.
- **`type: file`**: the entry is a single file (`site.json`), not a folder of entries.
- **`fields`**: each field's `name` must match a key in the JSON. Change `name: title` to
  `name: heading` and Pages CMS will read and write `heading` instead.

Commit and push:

```bash
git add .pages.yml
git commit -m "Add Pages CMS config"
git push
```

---

## Step 3: Connect Pages CMS to your repo

1. Go to **https://app.pagescms.org** and **sign in with GitHub**.
2. When asked, **install the Pages CMS GitHub App** on your account. You can limit it to
   this one repository.
3. Pick **pages-cms-tutorial** from the repo list. Pages CMS reads `.pages.yml` from the
   branch you're on, here `main`.
4. In the sidebar, open **Site settings**.
5. Change the **Tagline** and click **Save**.

Now look at your repo's commit history on GitHub. Pages CMS made a new commit that changes
`src/data/site.json`.

Pull the change locally:

```bash
git pull
```

✅ **Check:** the dev server shows your new tagline.

> 💡 You've now seen the whole loop: form → commit → file → site. The remaining steps
> add more content types using the same idea.

---

## Step 4: Add the posts collection

Add a second entry under `content:` in `.pages.yml`:

```yaml
  - name: posts
    label: Posts
    type: collection              # a folder where each file is an entry
    path: src/content/posts
    format: yaml-frontmatter      # YAML between --- lines, then a Markdown body
    fields:
      - name: title
        label: Title
        type: string
        required: true
      - name: date
        label: Date
        type: date                # saved as yyyy-MM-dd by default
      - name: description
        label: Description
        type: text
      - name: cover
        label: Cover image
        type: image               # uses the media settings from step 2
      - name: draft
        label: Draft
        type: boolean
        default: false
      - name: body
        label: Body
        type: rich-text           # a field named "body" is the Markdown body
        options:
          format: markdown        # keep the body as Markdown (not HTML)
```

Compare these fields with `src/content.config.ts`:

| `.pages.yml` field | Astro schema (`content.config.ts`) |
|---|---|
| `title: string, required` | `title: z.string()` |
| `date: date` | `date: z.coerce.date()` |
| `description: text` | `description: z.string().optional()` |
| `cover: image` | `cover: z.string().nullish()` |
| `draft: boolean` | `draft: z.boolean().default(false)` |
| `body: rich-text` | (the Markdown body, rendered with `<Content />`) |

Push, then reload Pages CMS.

✅ **Check:** a **Posts** section lists your 3 posts, including the draft. Try these:

- Open **An unfinished idea**, turn **Draft** off, and save. Then `git pull`. The post now
  appears on the site.
- Create a new post with a cover image that you upload. The image is committed to
  `public/images/`.

---

## Step 5: Improve the editing experience

These options only change how the CMS looks and names files. Your content stays the same.
Add them to the `posts` entry, at the same level as `fields`:

```yaml
    filename: "{year}-{month}-{day}-{primary}.md"   # new files: 2026-11-15-my-title.md
    view:
      fields: [title, date, draft]   # columns in the list view
      primary: title                 # the main column, also used for {primary}
      sort: [date, title]            # fields you can sort by
      default:
        sort: date
        order: desc                  # newest first
```

The `filename` template matters here: Astro uses the filename as the post URL
(`/posts/2026-11-15-my-title/`).

✅ **Check:** the Posts list has Title / Date / Draft columns sorted newest first. A new post
gets a dated filename.

---

## Step 6: Practice by adding a field yourself

Add **tags** to posts. You'll change the editor, Astro, and the template. That's the normal
workflow for any new field.

1. **`.pages.yml`**, inside the posts `fields`:
   ```yaml
      - name: tags
        label: Tags
        type: select
        options:
          values: [astro, cms, notes]
          multiple: true
   ```
2. **`src/content.config.ts`**, inside the schema:
   ```ts
   tags: z.array(z.string()).default([]),
   ```
3. **`src/pages/posts/[id].astro`**: show them under the title:
   ```astro
   {post.data.tags.length > 0 && <p>Tags: {post.data.tags.join(', ')}</p>}
   ```

If you skip step 2, Astro won't know about `tags`: TypeScript will complain and the data
isn't validated. If you write a schema that doesn't match the data, for example
`tags: z.string()`, the build fails as soon as someone saves tags. **Always update both
files.**

---

## Step 7 (optional): Deploy so edits go live without your laptop

Connect the GitHub repo to **Netlify**, **Vercel**, or **Cloudflare Pages**:

- Build command: `npm run build`
- Output folder: `dist`

Now every **Save** in Pages CMS → commit → automatic rebuild → live site, with no
`git pull` needed. At this point non-technical people can edit the site.

---

## The finished `.pages.yml`

<details>
<summary>Click to reveal (try writing it yourself first)</summary>

```yaml
media:
  input: public/images
  output: /images

content:
  - name: posts
    label: Posts
    type: collection
    path: src/content/posts
    format: yaml-frontmatter
    filename: "{year}-{month}-{day}-{primary}.md"
    view:
      fields: [title, date, draft]
      primary: title
      sort: [date, title]
      default:
        sort: date
        order: desc
    fields:
      - { name: title, label: Title, type: string, required: true }
      - { name: date, label: Date, type: date }
      - { name: description, label: Description, type: text }
      - { name: cover, label: Cover image, type: image }
      - { name: draft, label: Draft, type: boolean, default: false }
      - name: tags
        label: Tags
        type: select
        options:
          values: [astro, cms, notes]
          multiple: true
      - name: body
        label: Body
        type: rich-text
        options:
          format: markdown

  - name: site
    label: Site settings
    type: file
    path: src/data/site.json
    format: json
    fields:
      - { name: title, label: Site title, type: string, required: true }
      - { name: tagline, label: Tagline, type: string }
      - { name: author, label: Author, type: string }
      - { name: footer, label: Footer text, type: text }
```

</details>

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Pages CMS says there's no config | `.pages.yml` isn't on the branch you opened, or you didn't push it |
| A section is empty | The `path` is wrong; it's relative to the repo root |
| Images are broken on the site | `media.output` doesn't match the folder Astro serves (`public/images` → `/images`) |
| Build fails after an edit in the CMS | The field in `.pages.yml` doesn't match `content.config.ts`, e.g. it's missing from the Zod schema or has the wrong type |
| Changes don't show locally | Run `git pull`. The CMS commits to GitHub, not to your machine |

**Docs:** https://pagescms.org/docs/ (see *Configuration → Content → Fields* for all field
types: number, reference, object, `list: true`, block, and more).
