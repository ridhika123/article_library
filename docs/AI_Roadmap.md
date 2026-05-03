# Article Library: AI Integration Roadmap

This document serves as a living brainstorm and roadmap for adding intelligence and AI into the Article Library application.

## Phase 1: Smart Summarization & Auto-Tagging (Current Focus)

These are the quickest wins that provide immediate, visible value to the user without requiring significant database schema changes.

### 1. Smart Summarization & "TL;DR"
*   **Functionality:** When a user opens an article, they are presented with a 3-bullet-point summary, key takeaways, and an estimated reading time.
*   **Use Case:** Helps users quickly grasp the core concept of an article and decide if they want to invest time in reading the whole piece. Excellent for tackling a massive reading backlog.
*   **Technology:** LLMs like **Gemini 1.5 Flash** (perfect for fast, low-latency text processing).
*   **Implementation Idea:** Add a background job or an API route (`/api/ai/summarize`) that passes the extracted article text to the LLM. Store the summary in the Supabase `articles` table in a new `summary` column.

### 2. Auto-Categorization & Auto-Tagging
*   **Functionality:** When a user saves an article via URL, the AI automatically reads the content and assigns relevant tags, suggests a folder, and extracts metadata (author, publisher, key topics).
*   **Use Case:** Eliminates the friction of manually organizing the library.
*   **Technology:** LLMs for zero-shot classification (asking the AI to pick the best categories from existing folders) and Entity Extraction.
*   **Implementation Idea:** Can be bundled with the Summarization API or as a separate `/api/ai/tag` route. Will require adding a `tags` array or similar structure to the database.

---

## Phase 2: Semantic Discovery

Once basic AI features are in place, we can move towards more advanced search and discovery capabilities.

### 3. Semantic Search (Concept Search)
*   **Functionality:** Instead of typing exact keywords (like "React Server Components"), a user can search for "how to render things on the server" and find the right articles based on meaning.
*   **Use Case:** Superior search experience, especially as the library grows to hundreds of articles where keyword search breaks down.
*   **Technology:** Text Embeddings (e.g., Google `text-embedding-004`) combined with a Vector Database.
*   **Implementation Idea:** Utilize Supabase's `pgvector` extension. Generate an embedding for every article when it's saved and write a Postgres function to perform similarity searches.

### 4. Personalized "Read Next" Recommendations
*   **Functionality:** At the bottom of an article, or on the main dashboard, the app suggests other unread articles from the user's library that are highly related to their current interests.
*   **Use Case:** Increases engagement and helps users rediscover older saved articles.
*   **Technology:** Vector Similarity (Cosine Similarity).
*   **Implementation Idea:** If Semantic Search (embeddings) is implemented, this feature is very straightforward. Find articles with the closest vector distance to the one they just finished reading.

---

## Phase 3: The "Second Brain" & Accessibility

The most advanced features that turn the library into a true active research assistant.

### 5. "Chat With Your Library" (Personalized RAG)
*   **Functionality:** A chat interface where the user can ask questions like: *"What have I saved about the psychological effects of social media?"* The AI answers by synthesizing information *only* from the user's saved articles.
*   **Use Case:** Turns the app from a passive reading list into an active research assistant.
*   **Technology:** Retrieval-Augmented Generation (RAG).
*   **Implementation Idea:** Semantic search finds relevant paragraphs in the database, injects them into an LLM prompt, and lets the AI answer the user's question. Requires chunking article text.

### 6. High-Fidelity Audio Generation (Podcast Mode)
*   **Functionality:** A "Listen" button that generates a highly realistic, human-sounding audio version of the article.
*   **Use Case:** Accessibility and multitasking (listening while commuting or exercising).
*   **Technology:** AI Text-to-Speech (TTS) models like ElevenLabs or OpenAI TTS.
*   **Implementation Idea:** Requires calling the TTS API, storing the audio files (e.g., in Supabase Storage), and building an audio player UI in React.

### 7. Translation & Localization
*   **Functionality:** Instantly translate an article from any language into the user's native language, preserving formatting.
*   **Use Case:** Breaking down language barriers.
*   **Technology:** LLMs (Gemini Pro) for nuanced translation.
*   **Implementation Idea:** A prompt on the frontend or backend that rewrites the HTML/Markdown content in the target language.
