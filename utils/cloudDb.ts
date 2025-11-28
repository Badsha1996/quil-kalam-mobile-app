// @ts-ignore
import { neon } from "@neondatabase/serverless";
import { db } from "./database";

const NEON_CONNECTION_STRING = process.env.EXPO_PUBLIC_NEON_DATABASE_URL || "";
let neonDb: ReturnType<typeof neon> | null = null;

if (NEON_CONNECTION_STRING) {
  neonDb = neon(NEON_CONNECTION_STRING);
}

// ==================== NEON DATABASE INITIALIZATION ====================

export const initNeonDB = async () => {
  if (!neonDb) {
    throw new Error("Neon database not configured");
  }

  try {
    // Users table
    await neonDb`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        phone_number TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT,
        email TEXT,
        profile_image_url TEXT,
        bio TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Published projects
    await neonDb`
      CREATE TABLE IF NOT EXISTS published_projects (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        genre TEXT,
        author_name TEXT,
        cover_image_url TEXT,
        word_count INTEGER DEFAULT 0,
        
        -- Publishing metadata
        isbn TEXT,
        publisher TEXT,
        publication_date TIMESTAMPTZ,
        price NUMERIC(10, 2),
        language TEXT DEFAULT 'en',
        copyright_text TEXT,
        categories TEXT[],
        tags TEXT[],
        
        -- Visibility and permissions
        is_public BOOLEAN DEFAULT TRUE,
        allow_comments BOOLEAN DEFAULT TRUE,
        allow_downloads BOOLEAN DEFAULT FALSE,
        
        -- Engagement metrics
        view_count INTEGER DEFAULT 0,
        download_count INTEGER DEFAULT 0,
        like_count INTEGER DEFAULT 0,
        comment_count INTEGER DEFAULT 0,
        
        -- Status
        status TEXT DEFAULT 'published',
        
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        published_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Published items (content structure)
    await neonDb`
      CREATE TABLE IF NOT EXISTS published_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES published_projects(id) ON DELETE CASCADE,
        parent_item_id UUID REFERENCES published_items(id) ON DELETE CASCADE,
        item_type TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        content TEXT,
        metadata JSONB,
        order_index INTEGER DEFAULT 0,
        depth_level INTEGER DEFAULT 0,
        word_count INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Comments
    await neonDb`
      CREATE TABLE IF NOT EXISTS comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES published_projects(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_edited BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;

    // Likes
    await neonDb`
      CREATE TABLE IF NOT EXISTS likes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES published_projects(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(project_id, user_id)
      )
    `;

    // Follows
    await neonDb`
      CREATE TABLE IF NOT EXISTS follows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(follower_id, following_id)
      )
    `;

    // Reading history
    await neonDb`
      CREATE TABLE IF NOT EXISTS reading_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_id UUID NOT NULL REFERENCES published_projects(id) ON DELETE CASCADE,
        last_read_item_id UUID REFERENCES published_items(id),
        progress_percentage NUMERIC(5, 2) DEFAULT 0,
        last_read_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, project_id)
      )
    `;

    // Create indexes for performance
    await neonDb`CREATE INDEX IF NOT EXISTS idx_published_projects_user ON published_projects(user_id)`;
    await neonDb`CREATE INDEX IF NOT EXISTS idx_published_items_project ON published_items(project_id)`;
    await neonDb`CREATE INDEX IF NOT EXISTS idx_comments_project ON comments(project_id)`;
    await neonDb`CREATE INDEX IF NOT EXISTS idx_likes_project ON likes(project_id)`;
    await neonDb`CREATE INDEX IF NOT EXISTS idx_reading_history_user ON reading_history(user_id)`;

    console.log("✅ Neon database initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing Neon database:", error);
    throw error;
  }
};

// ==================== AUTHENTICATION ====================

export const registerUser = async (
  phoneNumber: string,
  password: string,
  displayName?: string
) => {
  if (!neonDb) throw new Error("Neon database not configured");

  try {
    // Hash password (use bcrypt in production)
    const bcrypt = require("bcryptjs");
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await neonDb`
      INSERT INTO users (phone_number, password_hash, display_name)
      VALUES (${phoneNumber}, ${passwordHash}, ${displayName || null})
      RETURNING id, phone_number, display_name, created_at
    `;

    // Cache user locally
    const now = Date.now();
    db.runSync(
      "INSERT INTO users (phone_number, display_name, synced_user_id, created_at) VALUES (?, ?, ?, ?)",
      phoneNumber,
      displayName || null,
      // @ts-ignore
      result[0].id,
      now
    );
    // @ts-ignore
    return result[0];
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
};

export const loginUser = async (phoneNumber: string, password: string) => {
  if (!neonDb) throw new Error("Neon database not configured");

  try {
    const result = await neonDb`
      SELECT id, phone_number, password_hash, display_name, email, profile_image_url
      FROM users
      WHERE phone_number = ${phoneNumber} AND is_active = TRUE
    `;

    // @ts-ignore
    if (result.length === 0) {
      throw new Error("Invalid credentials");
    }
    // @ts-ignore
    const user = result[0];
    const bcrypt = require("bcryptjs");
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    // Update local cache
    const now = Date.now();
    db.runSync(
      `INSERT OR REPLACE INTO users (phone_number, display_name, email, profile_image_uri, synced_user_id, last_sync, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      phoneNumber,
      user.display_name,
      user.email,
      user.profile_image_url,
      user.id,
      now,
      now
    );

    return {
      id: user.id,
      phoneNumber: user.phone_number,
      displayName: user.display_name,
      email: user.email,
      profileImage: user.profile_image_url,
    };
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

// ==================== PUBLISHING ====================

export const publishProject = async (projectId: number, userId: string) => {
  if (!neonDb) throw new Error("Neon database not configured");

  try {
    // Get project details
    const project = db.getFirstSync(
      "SELECT * FROM projects WHERE id = ?",
      projectId
    ) as any;
    if (!project) throw new Error("Project not found");

    // Get all items to publish
    const items = db.getAllSync(
      "SELECT * FROM items WHERE project_id = ? AND is_included_in_export = 1 ORDER BY order_index ASC",
      projectId
    ) as any[];

    // Get publishing settings
    const settings = db.getFirstSync(
      "SELECT * FROM publishing_settings WHERE project_id = ?",
      projectId
    ) as any;

    // Insert into Neon
    const publishedProject = await neonDb`
      INSERT INTO published_projects (
        user_id, type, title, description, genre, author_name,
        cover_image_url, word_count, isbn, publisher, publication_date,
        price, language, copyright_text, categories, tags,
        is_public, allow_comments, allow_downloads
      ) VALUES (
        ${userId}, ${project.type}, ${project.title}, ${project.description},
        ${project.genre}, ${project.author_name}, ${project.cover_image_uri},
        ${project.word_count}, ${settings?.isbn}, ${settings?.publisher},
        ${settings?.publication_date}, ${settings?.price}, ${
      settings?.language || "en"
    },
        ${settings?.copyright_text}, ${
      settings?.categories ? settings.categories.split(",") : []
    },
        ${settings?.tags ? settings.tags.split(",") : []},
        ${settings?.is_public ?? true}, ${settings?.allow_comments ?? true},
        ${settings?.allow_downloads ?? false}
      )
      RETURNING id
    `;
    // @ts-ignore
    const publishedProjectId = publishedProject[0].id;

    // Publish items recursively
    const itemIdMap = new Map();
    for (const item of items) {
      const publishedItem = await neonDb`
        INSERT INTO published_items (
          project_id, parent_item_id, item_type, name, description,
          content, metadata, order_index, depth_level, word_count
        ) VALUES (
          ${publishedProjectId},
          ${item.parent_item_id ? itemIdMap.get(item.parent_item_id) : null},
          ${item.item_type}, ${item.name}, ${item.description},
          ${item.content}, ${item.metadata ? JSON.parse(item.metadata) : null},
          ${item.order_index}, ${item.depth_level}, ${item.word_count}
        )
        RETURNING id
      `;
      // @ts-ignore
      itemIdMap.set(item.id, publishedItem[0].id);
    }

    // Update local project
    const now = Date.now();
    db.runSync(
      "UPDATE projects SET is_published = 1, published_at = ?, published_project_id = ?, status = 'published' WHERE id = ?",
      now,
      publishedProjectId,
      projectId
    );

    return publishedProjectId;
  } catch (error) {
    console.error("Error publishing project:", error);
    throw error;
  }
};

export const unpublishProject = async (projectId: number) => {
  if (!neonDb) throw new Error("Neon database not configured");

  try {
    const project = db.getFirstSync(
      "SELECT published_project_id FROM projects WHERE id = ?",
      projectId
    ) as { published_project_id: string } | null;

    if (!project?.published_project_id) {
      throw new Error("Project is not published");
    }

    // Delete from Neon
    await neonDb`
      DELETE FROM published_projects WHERE id = ${project.published_project_id}
    `;

    // Update local project
    db.runSync(
      "UPDATE projects SET is_published = 0, published_at = NULL, published_project_id = NULL WHERE id = ?",
      projectId
    );
  } catch (error) {
    console.error("Error unpublishing project:", error);
    throw error;
  }
};

