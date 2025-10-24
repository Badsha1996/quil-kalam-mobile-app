// @ts-ignore
import * as Crypto from "expo-crypto";
// @ts-ignore
import * as SQLite from "expo-sqlite";

export const db = SQLite.openDatabaseSync("quilkalam.db");

// ==================== PASSWORD HASHING ====================

const hashPassword = async (password: string): Promise<string> => {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password + "quilkalam_salt_2024"
  );
  return hash;
};

const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  const newHash = await hashPassword(password);
  return newHash === hash;
};

// ==================== DATABASE MIGRATION ====================

const getCurrentSchemaVersion = (): number => {
  try {
    const result = db.getFirstSync(
      "SELECT value FROM app_settings WHERE key = 'schema_version'"
    ) as { value: string } | null;
    return result ? parseInt(result.value) : 0;
  } catch {
    return 0;
  }
};

const setSchemaVersion = (version: number) => {
  try {
    const now = Date.now();
    db.runSync(
      "INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)",
      "schema_version",
      version.toString(),
      now
    );
  } catch (error) {
    console.error("Error setting schema version:", error);
  }
};

const migrateDatabase = () => {
  const currentVersion = getCurrentSchemaVersion();
  console.log(`Current database version: ${currentVersion}`);

  try {
    // Migration from version 0 to 1 (add user support)
    if (currentVersion < 1) {
      console.log("Migrating to version 1: Adding user support...");

      // Check if users table exists
      const usersTableExists = db.getFirstSync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
      );

      if (!usersTableExists) {
        db.execSync(`
          CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            phone_number TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            display_name TEXT,
            email TEXT,
            profile_image_uri TEXT,
            bio TEXT,
            synced_user_id TEXT,
            last_sync INTEGER,
            created_at INTEGER NOT NULL
          );
        `);
      }

      // Add user_id column to projects if it doesn't exist
      try {
        db.execSync("ALTER TABLE projects ADD COLUMN user_id INTEGER;");
        console.log("Added user_id column to projects");
      } catch (error: any) {
        if (!error.message?.includes("duplicate column")) {
          throw error;
        }
        console.log("user_id column already exists");
      }

      // Add publishing columns to projects
      const columnsToAdd = [
        { name: "is_published", type: "BOOLEAN DEFAULT 0" },
        { name: "published_at", type: "INTEGER" },
        { name: "published_project_id", type: "TEXT" },
        { name: "cover_image_uri", type: "TEXT" },
      ];

      for (const col of columnsToAdd) {
        try {
          db.execSync(
            `ALTER TABLE projects ADD COLUMN ${col.name} ${col.type};`
          );
          console.log(`Added ${col.name} column to projects`);
        } catch (error: any) {
          if (!error.message?.includes("duplicate column")) {
            console.warn(`Warning adding ${col.name}:`, error.message);
          }
        }
      }

      setSchemaVersion(1);
      console.log("Migration to version 1 completed");
    }

    // Migration from version 1 to 2 (unified items system)
    if (currentVersion < 2) {
      console.log("Migrating to version 2: Unified items system...");

      // Check if items table exists
      const itemsTableExists = db.getFirstSync(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='items'"
      );

      if (!itemsTableExists) {
        db.execSync(`
          CREATE TABLE items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            parent_item_id INTEGER,
            item_type TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            content TEXT,
            metadata TEXT,
            order_index INTEGER DEFAULT 0,
            depth_level INTEGER DEFAULT 0,
            color TEXT,
            icon TEXT,
            is_included_in_export BOOLEAN DEFAULT 1,
            is_published BOOLEAN DEFAULT 0,
            word_count INTEGER DEFAULT 0,
            character_count INTEGER DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (parent_item_id) REFERENCES items(id) ON DELETE CASCADE
          );
        `);

        db.execSync(
          "CREATE INDEX IF NOT EXISTS idx_items_project ON items(project_id);"
        );
        db.execSync(
          "CREATE INDEX IF NOT EXISTS idx_items_parent ON items(parent_item_id);"
        );
        db.execSync(
          "CREATE INDEX IF NOT EXISTS idx_items_type ON items(item_type);"
        );

        // Migrate old data if exists
        migrateOldDataToItems();
      }

      setSchemaVersion(2);
      console.log("Migration to version 2 completed");
    }

    // In migrateDatabase() function, add version 3 migration
    if (currentVersion < 3) {
      console.log("Migrating to version 3: Adding writing settings...");

      db.execSync(`
    CREATE TABLE IF NOT EXISTS writing_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER,
      user_id INTEGER,
      font_family TEXT DEFAULT 'Georgia',
      font_size INTEGER DEFAULT 18,
      line_height REAL DEFAULT 1.8,
      text_color TEXT DEFAULT '#1F2937',
      background_color TEXT DEFAULT '#FFFFFF',
      paragraph_spacing INTEGER DEFAULT 16,
      text_align TEXT DEFAULT 'left',
      page_width INTEGER DEFAULT 650,
      margin_top INTEGER DEFAULT 40,
      margin_bottom INTEGER DEFAULT 40,
      typewriter_mode BOOLEAN DEFAULT 0,
      auto_save BOOLEAN DEFAULT 1,
      zen_mode BOOLEAN DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

      setSchemaVersion(3);
    }
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  }
};

const migrateOldDataToItems = () => {
  try {
    console.log("Migrating old folder/file data to items...");

    // Migrate folders
    const foldersExist = db.getFirstSync(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='folders'"
    );

    if (foldersExist) {
      const folders = db.getAllSync("SELECT * FROM folders") as any[];
      console.log(`Migrating ${folders.length} folders...`);

      for (const folder of folders) {
        try {
          db.runSync(
            `INSERT INTO items (
              project_id, parent_item_id, item_type, name, description,
              order_index, depth_level, color, icon, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            folder.project_id,
            folder.parent_folder_id || null,
            folder.folder_type || "folder",
            folder.name,
            folder.description || "",
            folder.order_index || 0,
            0,
            folder.color || null,
            folder.icon || null,
            folder.created_at,
            folder.updated_at
          );
        } catch (error) {
          console.warn("Error migrating folder:", error);
        }
      }
    }

    // Migrate files
    const filesExist = db.getFirstSync(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='files'"
    );

    if (filesExist) {
      const files = db.getAllSync("SELECT * FROM files") as any[];
      console.log(`Migrating ${files.length} files...`);

      for (const file of files) {
        try {
          db.runSync(
            `INSERT INTO items (
              project_id, parent_item_id, item_type, name, content,
              word_count, order_index, is_included_in_export,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            file.project_id,
            file.folder_id || null,
            file.file_type || "document",
            file.name,
            file.content || "",
            file.word_count || 0,
            file.order_index || 0,
            file.is_included_in_export !== 0 ? 1 : 0,
            file.created_at,
            file.updated_at
          );
        } catch (error) {
          console.warn("Error migrating file:", error);
        }
      }
    }

    // Migrate characters
    const charactersExist = db.getFirstSync(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='characters'"
    );

    if (charactersExist) {
      const characters = db.getAllSync("SELECT * FROM characters") as any[];
      console.log(`Migrating ${characters.length} characters...`);

      for (const char of characters) {
        try {
          const metadata = {
            role: char.role,
            backstory: char.backstory,
            goals: char.goals,
            traits: char.traits,
            imageUri: char.image_uri,
          };

          db.runSync(
            `INSERT INTO items (
              project_id, item_type, name, description, metadata,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            char.project_id,
            "character",
            char.name,
            char.description || "",
            JSON.stringify(metadata),
            char.created_at,
            char.updated_at
          );
        } catch (error) {
          console.warn("Error migrating character:", error);
        }
      }
    }

    // Migrate locations
    const locationsExist = db.getFirstSync(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='locations'"
    );

    if (locationsExist) {
      const locations = db.getAllSync("SELECT * FROM locations") as any[];
      console.log(`Migrating ${locations.length} locations...`);

      for (const loc of locations) {
        try {
          const metadata = {
            notes: loc.notes,
            imageUri: loc.image_uri,
          };

          db.runSync(
            `INSERT INTO items (
              project_id, item_type, name, description, metadata,
              created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            loc.project_id,
            "location",
            loc.name,
            loc.description || "",
            JSON.stringify(metadata),
            loc.created_at,
            loc.updated_at
          );
        } catch (error) {
          console.warn("Error migrating location:", error);
        }
      }
    }

    console.log("Old data migration completed");
  } catch (error) {
    console.error("Error migrating old data:", error);
  }
};

// ==================== INITIALIZATION ====================

export const initDB = () => {
  try {
    console.log("Initializing database...");

    // Create app_settings table first (needed for version tracking)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS app_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        updated_at INTEGER NOT NULL
      );
    `);

    // Create basic tables if they don't exist
    db.execSync(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        genre TEXT,
        author_name TEXT,
        writing_template TEXT DEFAULT 'freeform',
        word_count INTEGER DEFAULT 0,
        target_word_count INTEGER,
        status TEXT DEFAULT 'draft',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // Create other essential tables
    db.execSync(`
      CREATE TABLE IF NOT EXISTS publishing_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL UNIQUE,
        isbn TEXT,
        publisher TEXT,
        publication_date INTEGER,
        price REAL,
        language TEXT DEFAULT 'en',
        copyright_text TEXT,
        dedication TEXT,
        acknowledgments TEXT,
        categories TEXT,
        tags TEXT,
        is_public BOOLEAN DEFAULT 1,
        allow_comments BOOLEAN DEFAULT 1,
        allow_downloads BOOLEAN DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
    `);

    db.execSync(`
      CREATE TABLE IF NOT EXISTS formatting_styles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        item_id INTEGER,
        scope TEXT NOT NULL,
        styles TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
    `);

    db.execSync(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entity_type TEXT NOT NULL,
        entity_id INTEGER NOT NULL,
        action TEXT NOT NULL,
        payload TEXT,
        created_at INTEGER NOT NULL
      );
    `);

    // Run migrations
    migrateDatabase();

    console.log("✅ Database initialized successfully");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    throw error;
  }
};

// ==================== ALL OTHER FUNCTIONS FROM PREVIOUS ARTIFACT ====================
// (Copy all functions from mobile_compatible_db artifact here)

export const registerLocalUser = async (
  phoneNumber: string,
  password: string,
  displayName?: string
) => {
  try {
    const passwordHash = await hashPassword(password);
    const now = Date.now();

    const result = db.runSync(
      "INSERT INTO users (phone_number, password_hash, display_name, created_at) VALUES (?, ?, ?, ?)",
      phoneNumber,
      passwordHash,
      displayName || null,
      now
    );

    return {
      id: result.lastInsertRowId,
      phoneNumber,
      displayName: displayName || null,
    };
  } catch (error: any) {
    if (error.message?.includes("UNIQUE constraint")) {
      throw new Error("Phone number already registered");
    }
    console.error("Error registering user:", error);
    throw error;
  }
};

export const loginLocalUser = async (phoneNumber: string, password: string) => {
  try {
    const user = db.getFirstSync(
      "SELECT * FROM users WHERE phone_number = ?",
      phoneNumber
    ) as any;

    if (!user) {
      throw new Error("Invalid credentials");
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      throw new Error("Invalid credentials");
    }

    return {
      id: user.id,
      phoneNumber: user.phone_number,
      displayName: user.display_name,
      email: user.email,
      profileImage: user.profile_image_uri,
      bio: user.bio,
    };
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
};

export const getCurrentUser = () => {
  try {
    const user = db.getFirstSync(
      "SELECT * FROM users ORDER BY last_sync DESC LIMIT 1"
    ) as any;

    if (!user) return null;

    return {
      id: user.id,
      phoneNumber: user.phone_number,
      displayName: user.display_name,
      email: user.email,
      profileImage: user.profile_image_uri,
      bio: user.bio,
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
};

export const updateUserProfile = (
  userId: number,
  data: {
    displayName?: string;
    email?: string;
    bio?: string;
    profileImageUri?: string;
  }
) => {
  try {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.displayName !== undefined) {
      updates.push("display_name = ?");
      values.push(data.displayName);
    }
    if (data.email !== undefined) {
      updates.push("email = ?");
      values.push(data.email);
    }
    if (data.bio !== undefined) {
      updates.push("bio = ?");
      values.push(data.bio);
    }
    if (data.profileImageUri !== undefined) {
      updates.push("profile_image_uri = ?");
      values.push(data.profileImageUri);
    }

    values.push(userId);

    db.runSync(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      ...values
    );
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
};

// ==================== APP SETTINGS ====================

export const setSetting = (key: string, value: string) => {
  try {
    const now = Date.now();
    db.runSync(
      "INSERT OR REPLACE INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)",
      key,
      value,
      now
    );
  } catch (error) {
    console.error("Error setting app setting:", error);
    throw error;
  }
};

export const getSetting = (key: string, defaultValue?: string) => {
  try {
    const result = db.getFirstSync(
      "SELECT value FROM app_settings WHERE key = ?",
      key
    ) as { value: string } | null;
    return result?.value || defaultValue || null;
  } catch (error) {
    console.error("Error getting app setting:", error);
    return defaultValue || null;
  }
};

// ==================== PROJECT OPERATIONS ====================

export const createProject = (data: {
  type: "novel" | "poetry" | "shortStory" | "manuscript";
  title: string;
  description?: string;
  genre?: string;
  authorName?: string;
  writingTemplate?: string;
  targetWordCount?: number;
}) => {
  try {
    const now = Date.now();
    const result = db.runSync(
      `INSERT INTO projects (type, title, description, genre, author_name, writing_template, target_word_count, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      data.type,
      data.title,
      data.description || "",
      data.genre || "",
      data.authorName || "",
      data.writingTemplate || "freeform",
      data.targetWordCount || null,
      now,
      now
    );

    const projectId = result.lastInsertRowId;

    // Auto-create content page
    db.runSync(
      "INSERT OR IGNORE INTO content_pages (project_id, created_at, updated_at) VALUES (?, ?, ?)",
      projectId,
      now,
      now
    );

    // If using Hero's Journey template, create template stages
    if (data.writingTemplate === "heros_journey") {
      createHerosJourneyStages(projectId);
    }

    return projectId;
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

const createHerosJourneyStages = (projectId: number) => {
  const stages = [
    {
      name: "Ordinary World",
      description: "Introduce the hero in their normal life",
    },
    {
      name: "Call to Adventure",
      description: "The hero is presented with a challenge",
    },
    {
      name: "Refusal of the Call",
      description: "Initial reluctance to accept the challenge",
    },
    { name: "Meeting the Mentor", description: "Guidance from a wise figure" },
    {
      name: "Crossing the Threshold",
      description: "Commitment to the journey",
    },
    {
      name: "Tests, Allies, Enemies",
      description: "Facing challenges and meeting key characters",
    },
    {
      name: "Approach to the Inmost Cave",
      description: "Preparation for the major challenge",
    },
    {
      name: "Ordeal",
      description: "The greatest challenge - facing death/greatest fear",
    },
    { name: "Reward", description: "Achieving the goal or gaining knowledge" },
    { name: "The Road Back", description: "Beginning the return journey" },
    {
      name: "Resurrection",
      description: "Final test using everything learned",
    },
    {
      name: "Return with the Elixir",
      description: "Returning home transformed",
    },
  ];

  stages.forEach((stage, index) => {
    db.runSync(
      "INSERT INTO template_stages (project_id, template_type, stage_name, stage_description, order_index) VALUES (?, ?, ?, ?, ?)",
      projectId,
      "heros_journey",
      stage.name,
      stage.description,
      index
    );
  });
};

export const getProject = (id: number) => {
  try {
    return db.getFirstSync("SELECT * FROM projects WHERE id = ?", id);
  } catch (error) {
    console.error("Error getting project:", error);
    return null;
  }
};

export const getAllProjects = () => {
  try {
    return db.getAllSync("SELECT * FROM projects ORDER BY updated_at DESC");
  } catch (error) {
    console.error("Error getting projects:", error);
    return [];
  }
};

export const updateProject = (
  id: number,
  data: {
    title?: string;
    description?: string;
    genre?: string;
    status?: string;
    targetWordCount?: number;
  }
) => {
  try {
    const now = Date.now();
    const updates: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      updates.push("title = ?");
      values.push(data.title);
    }
    if (data.description !== undefined) {
      updates.push("description = ?");
      values.push(data.description);
    }
    if (data.genre !== undefined) {
      updates.push("genre = ?");
      values.push(data.genre);
    }
    if (data.status !== undefined) {
      updates.push("status = ?");
      values.push(data.status);
    }
    if (data.targetWordCount !== undefined) {
      updates.push("target_word_count = ?");
      values.push(data.targetWordCount);
    }

    updates.push("updated_at = ?");
    values.push(now);
    values.push(id);

    db.runSync(
      `UPDATE projects SET ${updates.join(", ")} WHERE id = ?`,
      ...values
    );
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};

export const deleteProject = (id: number) => {
  try {
    db.runSync("DELETE FROM projects WHERE id = ?", id);
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
};

// ==================== COVER OPERATIONS ====================

export const setProjectCover = (
  projectId: number,
  coverType: "front" | "back" | "spine",
  imageUri: string,
  width?: number,
  height?: number
) => {
  try {
    const now = Date.now();
    db.runSync(
      `INSERT OR REPLACE INTO project_covers (project_id, cover_type, image_uri, image_width, image_height, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      projectId,
      coverType,
      imageUri,
      width || null,
      height || null,
      now,
      now
    );
  } catch (error) {
    console.error("Error setting cover:", error);
    throw error;
  }
};

export const getProjectCovers = (projectId: number) => {
  try {
    return db.getAllSync(
      "SELECT * FROM project_covers WHERE project_id = ?",
      projectId
    );
  } catch (error) {
    console.error("Error getting covers:", error);
    return [];
  }
};

// ==================== FOLDER OPERATIONS ====================

export const createFolder = (data: {
  projectId: number;
  parentFolderId?: number;
  name: string;
  description?: string;
  folderType?: string;
  orderIndex?: number;
  color?: string;
}) => {
  try {
    const now = Date.now();
    const result = db.runSync(
      `INSERT INTO folders (project_id, parent_folder_id, name, description, folder_type, order_index, color, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      data.projectId,
      data.parentFolderId || null,
      data.name,
      data.description || "",
      data.folderType || "chapter",
      data.orderIndex || 0,
      data.color || null,
      now,
      now
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error("Error creating folder:", error);
    throw error;
  }
};

export const getFoldersByProject = (projectId: number) => {
  try {
    return db.getAllSync(
      "SELECT * FROM folders WHERE project_id = ? ORDER BY order_index ASC",
      projectId
    );
  } catch (error) {
    console.error("Error getting folders:", error);
    return [];
  }
};

export const updateFolder = (
  id: number,
  data: {
    name?: string;
    description?: string;
    orderIndex?: number;
    color?: string;
  }
) => {
  try {
    const now = Date.now();
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push("name = ?");
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push("description = ?");
      values.push(data.description);
    }
    if (data.orderIndex !== undefined) {
      updates.push("order_index = ?");
      values.push(data.orderIndex);
    }
    if (data.color !== undefined) {
      updates.push("color = ?");
      values.push(data.color);
    }

    updates.push("updated_at = ?");
    values.push(now);
    values.push(id);

    db.runSync(
      `UPDATE folders SET ${updates.join(", ")} WHERE id = ?`,
      ...values
    );
  } catch (error) {
    console.error("Error updating folder:", error);
    throw error;
  }
};

export const deleteFolder = (id: number) => {
  try {
    db.runSync("DELETE FROM folders WHERE id = ?", id);
  } catch (error) {
    console.error("Error deleting folder:", error);
    throw error;
  }
};

// ==================== FILE OPERATIONS ====================

export const createFile = (data: {
  projectId: number;
  folderId?: number;
  fileType:
    | "text"
    | "document"
    | "image"
    | "note"
    | "character"
    | "location"
    | "research";
  name: string;
  content?: string;
  imageUri?: string;
  orderIndex?: number;
}) => {
  try {
    const now = Date.now();
    const wordCount = data.content
      ? data.content.trim().split(/\s+/).length
      : 0;

    const result = db.runSync(
      `INSERT INTO files (project_id, folder_id, file_type, name, content, image_uri, word_count, order_index, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      data.projectId,
      data.folderId || null,
      data.fileType,
      data.name,
      data.content || "",
      data.imageUri || null,
      wordCount,
      data.orderIndex || 0,
      now,
      now
    );

    // Update project word count
    updateProjectWordCount(data.projectId);

    return result.lastInsertRowId;
  } catch (error) {
    console.error("Error creating file:", error);
    throw error;
  }
};

export const getFilesByProject = (projectId: number) => {
  try {
    return db.getAllSync(
      "SELECT * FROM files WHERE project_id = ? ORDER BY order_index ASC",
      projectId
    );
  } catch (error) {
    console.error("Error getting files:", error);
    return [];
  }
};

export const getFilesByFolder = (folderId: number) => {
  try {
    return db.getAllSync(
      "SELECT * FROM files WHERE folder_id = ? ORDER BY order_index ASC",
      folderId
    );
  } catch (error) {
    console.error("Error getting files by folder:", error);
    return [];
  }
};

export const updateFile = (
  id: number,
  data: {
    name?: string;
    content?: string;
    imageUri?: string;
    orderIndex?: number;
    isIncludedInExport?: boolean;
  }
) => {
  try {
    const now = Date.now();
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push("name = ?");
      values.push(data.name);
    }
    if (data.content !== undefined) {
      updates.push("content = ?");
      values.push(data.content);
      const wordCount = data.content.trim().split(/\s+/).length;
      updates.push("word_count = ?");
      values.push(wordCount);
    }
    if (data.imageUri !== undefined) {
      updates.push("image_uri = ?");
      values.push(data.imageUri);
    }
    if (data.orderIndex !== undefined) {
      updates.push("order_index = ?");
      values.push(data.orderIndex);
    }
    if (data.isIncludedInExport !== undefined) {
      updates.push("is_included_in_export = ?");
      values.push(data.isIncludedInExport ? 1 : 0);
    }

    updates.push("updated_at = ?");
    values.push(now);
    values.push(id);

    db.runSync(
      `UPDATE files SET ${updates.join(", ")} WHERE id = ?`,
      ...values
    );

    // Update project word count if content was changed
    if (data.content !== undefined) {
      const file = db.getFirstSync(
        "SELECT project_id FROM files WHERE id = ?",
        id
      ) as { project_id: number } | null;
      if (file) {
        updateProjectWordCount(file.project_id);
      }
    }
  } catch (error) {
    console.error("Error updating file:", error);
    throw error;
  }
};

export const deleteFile = (id: number) => {
  try {
    const file = db.getFirstSync(
      "SELECT project_id FROM files WHERE id = ?",
      id
    ) as { project_id: number } | null;
    db.runSync("DELETE FROM files WHERE id = ?", id);

    if (file) {
      updateProjectWordCount(file.project_id);
    }
  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};

// ==================== CONTENT PAGE OPERATIONS ====================

export const getContentPage = (projectId: number) => {
  try {
    return db.getFirstSync(
      "SELECT * FROM content_pages WHERE project_id = ?",
      projectId
    );
  } catch (error) {
    console.error("Error getting content page:", error);
    return null;
  }
};

export const updateContentPage = (
  projectId: number,
  data: {
    title?: string;
    isAutoGenerated?: boolean;
    customContent?: string;
    showPageNumbers?: boolean;
    showWordCounts?: boolean;
  }
) => {
  try {
    const now = Date.now();
    const updates: string[] = [];
    const values: any[] = [];

    if (data.title !== undefined) {
      updates.push("title = ?");
      values.push(data.title);
    }
    if (data.isAutoGenerated !== undefined) {
      updates.push("is_auto_generated = ?");
      values.push(data.isAutoGenerated ? 1 : 0);
    }
    if (data.customContent !== undefined) {
      updates.push("custom_content = ?");
      values.push(data.customContent);
    }
    if (data.showPageNumbers !== undefined) {
      updates.push("show_page_numbers = ?");
      values.push(data.showPageNumbers ? 1 : 0);
    }
    if (data.showWordCounts !== undefined) {
      updates.push("show_word_counts = ?");
      values.push(data.showWordCounts ? 1 : 0);
    }

    updates.push("updated_at = ?");
    values.push(now);
    values.push(projectId);

    db.runSync(
      `UPDATE content_pages SET ${updates.join(", ")} WHERE project_id = ?`,
      ...values
    );
  } catch (error) {
    console.error("Error updating content page:", error);
    throw error;
  }
};

export const deleteContentPage = (projectId: number) => {
  try {
    db.runSync("DELETE FROM content_pages WHERE project_id = ?", projectId);
  } catch (error) {
    console.error("Error deleting content page:", error);
    throw error;
  }
};

// ==================== FORMATTING OPERATIONS ====================

export const setFormatting = (data: {
  projectId?: number;
  folderId?: number;
  fileId?: number;
  scope: "project" | "folder" | "file";
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  textAlign?: string;
  textColor?: string;
  backgroundColor?: string;
}) => {
  try {
    const now = Date.now();

    // Delete existing formatting for this scope
    if (data.scope === "project" && data.projectId) {
      db.runSync(
        'DELETE FROM formatting_styles WHERE project_id = ? AND scope = "project"',
        data.projectId
      );
    } else if (data.scope === "folder" && data.folderId) {
      db.runSync(
        'DELETE FROM formatting_styles WHERE folder_id = ? AND scope = "folder"',
        data.folderId
      );
    } else if (data.scope === "file" && data.fileId) {
      db.runSync(
        'DELETE FROM formatting_styles WHERE file_id = ? AND scope = "file"',
        data.fileId
      );
    }

    db.runSync(
      `INSERT INTO formatting_styles (
        project_id, folder_id, file_id, scope, font_family, font_size, 
        line_height, text_align, text_color, background_color, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      data.projectId || null,
      data.folderId || null,
      data.fileId || null,
      data.scope,
      data.fontFamily || "serif",
      data.fontSize || 16,
      data.lineHeight || 1.5,
      data.textAlign || "left",
      data.textColor || "#000000",
      data.backgroundColor || "#FFFFFF",
      now,
      now
    );
  } catch (error) {
    console.error("Error setting formatting:", error);
    throw error;
  }
};

export const getFormatting = (
  projectId?: number,
  folderId?: number,
  fileId?: number
) => {
  try {
    if (fileId) {
      return db.getFirstSync(
        "SELECT * FROM formatting_styles WHERE file_id = ?",
        fileId
      );
    } else if (folderId) {
      return db.getFirstSync(
        "SELECT * FROM formatting_styles WHERE folder_id = ?",
        folderId
      );
    } else if (projectId) {
      return db.getFirstSync(
        'SELECT * FROM formatting_styles WHERE project_id = ? AND scope = "project"',
        projectId
      );
    }
    return null;
  } catch (error) {
    console.error("Error getting formatting:", error);
    return null;
  }
};

// ==================== CHARACTER & LOCATION ====================

export const createCharacter = (
  projectId: number,
  data: {
    name: string;
    role?: string;
    description?: string;
    imageUri?: string;
    backstory?: string;
    goals?: string;
    traits?: string;
  }
) => {
  try {
    const now = Date.now();
    const result = db.runSync(
      `INSERT INTO characters (project_id, name, role, description, image_uri, backstory, goals, traits, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      projectId,
      data.name,
      data.role || null,
      data.description || "",
      data.imageUri || null,
      data.backstory || "",
      data.goals || "",
      data.traits || "",
      now,
      now
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error("Error creating character:", error);
    throw error;
  }
};

export const getCharactersByProject = (projectId: number) => {
  try {
    return db.getAllSync(
      "SELECT * FROM characters WHERE project_id = ?",
      projectId
    );
  } catch (error) {
    console.error("Error getting characters:", error);
    return [];
  }
};

export const createLocation = (
  projectId: number,
  data: {
    name: string;
    description?: string;
    imageUri?: string;
    notes?: string;
  }
) => {
  try {
    const now = Date.now();
    const result = db.runSync(
      `INSERT INTO locations (project_id, name, description, image_uri, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      projectId,
      data.name,
      data.description || "",
      data.imageUri || null,
      data.notes || "",
      now,
      now
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error("Error creating location:", error);
    throw error;
  }
};

export const getLocationsByProject = (projectId: number) => {
  try {
    return db.getAllSync(
      "SELECT * FROM locations WHERE project_id = ?",
      projectId
    );
  } catch (error) {
    console.error("Error getting locations:", error);
    return [];
  }
};

// ==================== STATISTICS ====================

export const getStats = () => {
  try {
    const totalProjects = db.getFirstSync(
      "SELECT COUNT(*) as count FROM projects"
    ) as { count: number } | null;
    const totalNovels = db.getFirstSync(
      'SELECT COUNT(*) as count FROM projects WHERE type = "novel"'
    ) as { count: number } | null;
    const totalWords = db.getFirstSync(
      "SELECT SUM(word_count) as total FROM projects"
    ) as { total: number } | null;

    return {
      totalProjects: totalProjects?.count || 0,
      totalNovels: totalNovels?.count || 0,
      totalWords: totalWords?.total || 0,
    };
  } catch (error) {
    console.error("Error getting stats:", error);
    return { totalProjects: 0, totalNovels: 0, totalWords: 0 };
  }
};

export const getProjectStats = (projectId: number) => {
  try {
    const project = db.getFirstSync(
      "SELECT * FROM projects WHERE id = ?",
      projectId
    ) as any;
    
    // Query the items table instead of separate tables
    const folderCount = db.getFirstSync(
      "SELECT COUNT(*) as count FROM items WHERE project_id = ? AND item_type IN ('folder', 'chapter')",
      projectId
    ) as { count: number } | null;
    
    const fileCount = db.getFirstSync(
      "SELECT COUNT(*) as count FROM items WHERE project_id = ? AND item_type IN ('document', 'note', 'research')",
      projectId
    ) as { count: number } | null;
    
    const characterCount = db.getFirstSync(
      "SELECT COUNT(*) as count FROM items WHERE project_id = ? AND item_type = 'character'",
      projectId
    ) as { count: number } | null;
    
    const locationCount = db.getFirstSync(
      "SELECT COUNT(*) as count FROM items WHERE project_id = ? AND item_type = 'location'",
      projectId
    ) as { count: number } | null;

    return {
      title: project?.title || "",
      type: project?.type || "",
      wordCount: project?.word_count || 0,
      targetWordCount: project?.target_word_count || 0,
      progress: project?.target_word_count
        ? (
            ((project?.word_count || 0) / project.target_word_count) *
            100
          ).toFixed(1)
        : "0",
      status: project?.status || "draft",
      folderCount: folderCount?.count || 0,
      fileCount: fileCount?.count || 0,
      characterCount: characterCount?.count || 0,
      locationCount: locationCount?.count || 0,
    };
  } catch (error) {
    console.error("Error getting project stats:", error);
    return {
      title: "",
      type: "",
      wordCount: 0,
      targetWordCount: 0,
      progress: "0",
      status: "draft",
      folderCount: 0,
      fileCount: 0,
      characterCount: 0,
      locationCount: 0,
    };
  }
};

// ==================== PUBLISHING OPERATIONS ====================

export const setPublishingSettings = (
  projectId: number,
  data: {
    isbn?: string;
    publisher?: string;
    publicationDate?: number;
    price?: number;
    language?: string;
    copyrightText?: string;
    dedication?: string;
    acknowledgments?: string;
    exportFormat?: "pdf" | "epub" | "docx";
  }
) => {
  try {
    const now = Date.now();
    const existing = db.getFirstSync(
      "SELECT id FROM publishing_settings WHERE project_id = ?",
      projectId
    );

    if (existing) {
      const updates: string[] = [];
      const values: any[] = [];

      if (data.isbn !== undefined) {
        updates.push("isbn = ?");
        values.push(data.isbn);
      }
      if (data.publisher !== undefined) {
        updates.push("publisher = ?");
        values.push(data.publisher);
      }
      if (data.publicationDate !== undefined) {
        updates.push("publication_date = ?");
        values.push(data.publicationDate);
      }
      if (data.price !== undefined) {
        updates.push("price = ?");
        values.push(data.price);
      }
      if (data.language !== undefined) {
        updates.push("language = ?");
        values.push(data.language);
      }
      if (data.copyrightText !== undefined) {
        updates.push("copyright_text = ?");
        values.push(data.copyrightText);
      }
      if (data.dedication !== undefined) {
        updates.push("dedication = ?");
        values.push(data.dedication);
      }
      if (data.acknowledgments !== undefined) {
        updates.push("acknowledgments = ?");
        values.push(data.acknowledgments);
      }
      if (data.exportFormat !== undefined) {
        updates.push("export_format = ?");
        values.push(data.exportFormat);
      }

      updates.push("updated_at = ?");
      values.push(now);
      values.push(projectId);

      db.runSync(
        `UPDATE publishing_settings SET ${updates.join(
          ", "
        )} WHERE project_id = ?`,
        ...values
      );
    } else {
      db.runSync(
        `INSERT INTO publishing_settings (
          project_id, isbn, publisher, publication_date, price, language, 
          copyright_text, dedication, acknowledgments, export_format, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        projectId,
        data.isbn || null,
        data.publisher || null,
        data.publicationDate || null,
        data.price || null,
        data.language || "en",
        data.copyrightText || null,
        data.dedication || null,
        data.acknowledgments || null,
        data.exportFormat || "pdf",
        now,
        now
      );
    }
  } catch (error) {
    console.error("Error setting publishing settings:", error);
    throw error;
  }
};

export const getPublishingSettings = (projectId: number) => {
  try {
    return db.getFirstSync(
      "SELECT * FROM publishing_settings WHERE project_id = ?",
      projectId
    );
  } catch (error) {
    console.error("Error getting publishing settings:", error);
    return null;
  }
};

// ==================== TEMPLATE STAGES ====================

export const getTemplateStages = (projectId: number) => {
  try {
    return db.getAllSync(
      "SELECT * FROM template_stages WHERE project_id = ? ORDER BY order_index ASC",
      projectId
    );
  } catch (error) {
    console.error("Error getting template stages:", error);
    return [];
  }
};

export const updateTemplateStage = (
  id: number,
  data: {
    isCompleted?: boolean;
    notes?: string;
    folderId?: number;
  }
) => {
  try {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.isCompleted !== undefined) {
      updates.push("is_completed = ?");
      values.push(data.isCompleted ? 1 : 0);
    }
    if (data.notes !== undefined) {
      updates.push("notes = ?");
      values.push(data.notes);
    }
    if (data.folderId !== undefined) {
      updates.push("folder_id = ?");
      values.push(data.folderId);
    }

    values.push(id);

    db.runSync(
      `UPDATE template_stages SET ${updates.join(", ")} WHERE id = ?`,
      ...values
    );
  } catch (error) {
    console.error("Error updating template stage:", error);
    throw error;
  }
};

// ==================== SEARCH & FILTER ====================

export const searchProjects = (query: string) => {
  try {
    const searchPattern = `%${query}%`;
    return db.getAllSync(
      "SELECT * FROM projects WHERE title LIKE ? OR description LIKE ? OR author_name LIKE ? ORDER BY updated_at DESC",
      searchPattern,
      searchPattern,
      searchPattern
    );
  } catch (error) {
    console.error("Error searching projects:", error);
    return [];
  }
};

export const getProjectsByType = (
  type: "novel" | "poetry" | "shortStory" | "manuscript"
) => {
  try {
    return db.getAllSync(
      "SELECT * FROM projects WHERE type = ? ORDER BY updated_at DESC",
      type
    );
  } catch (error) {
    console.error("Error filtering projects by type:", error);
    return [];
  }
};

export const getProjectsByGenre = (genre: string) => {
  try {
    return db.getAllSync(
      "SELECT * FROM projects WHERE genre = ? ORDER BY updated_at DESC",
      genre
    );
  } catch (error) {
    console.error("Error filtering by genre:", error);
    return [];
  }
};

export const searchFiles = (projectId: number, query: string) => {
  try {
    const searchPattern = `%${query}%`;
    return db.getAllSync(
      "SELECT * FROM files WHERE project_id = ? AND (name LIKE ? OR content LIKE ?) ORDER BY updated_at DESC",
      projectId,
      searchPattern,
      searchPattern
    );
  } catch (error) {
    console.error("Error searching files:", error);
    return [];
  }
};

// ==================== EXPORT PREPARATION ====================

export const getProjectForExport = (projectId: number) => {
  try {
    const project = getProject(projectId);
    const covers = getProjectCovers(projectId);
    const contentPage = getContentPage(projectId);
    const folders = getFoldersByProject(projectId);
    const files = db.getAllSync(
      "SELECT * FROM files WHERE project_id = ? AND is_included_in_export = 1 ORDER BY order_index ASC",
      projectId
    );
    const characters = getCharactersByProject(projectId);
    const locations = getLocationsByProject(projectId);
    const publishingSettings = getPublishingSettings(projectId);
    const formatting = getFormatting(projectId);

    return {
      project,
      covers,
      contentPage,
      folders,
      files,
      characters,
      locations,
      publishingSettings,
      formatting,
    };
  } catch (error) {
    console.error("Error preparing project for export:", error);
    return null;
  }
};

// ==================== BACKUP & RESTORE ====================

export const exportProjectAsJSON = (projectId: number) => {
  try {
    const data = getProjectForExport(projectId);
    return JSON.stringify(data, null, 2);
  } catch (error) {
    console.error("Error exporting project:", error);
    return null;
  }
};

export const importProjectFromJSON = (jsonData: string) => {
  try {
    const data = JSON.parse(jsonData);

    // Create new project
    const projectId = createProject({
      type: data.project.type,
      title: data.project.title + " (Imported)",
      description: data.project.description,
      genre: data.project.genre,
      authorName: data.project.author_name,
      writingTemplate: data.project.writing_template,
      targetWordCount: data.project.target_word_count,
    });

    // Import covers
    if (data.covers) {
      data.covers.forEach((cover: any) => {
        setProjectCover(
          projectId,
          cover.cover_type,
          cover.image_uri,
          cover.image_width,
          cover.image_height
        );
      });
    }

    // Import folders (with mapping for parent relationships)
    const folderMap = new Map();
    if (data.folders) {
      data.folders.forEach((folder: any) => {
        const newFolderId = createFolder({
          projectId,
          parentFolderId: folder.parent_folder_id
            ? folderMap.get(folder.parent_folder_id)
            : undefined,
          name: folder.name,
          description: folder.description,
          folderType: folder.folder_type,
          orderIndex: folder.order_index,
          color: folder.color,
        });
        folderMap.set(folder.id, newFolderId);
      });
    }

    // Import files
    if (data.files) {
      data.files.forEach((file: any) => {
        createFile({
          projectId,
          folderId: file.folder_id ? folderMap.get(file.folder_id) : undefined,
          fileType: file.file_type,
          name: file.name,
          content: file.content,
          imageUri: file.image_uri,
          orderIndex: file.order_index,
        });
      });
    }

    // Import characters
    if (data.characters) {
      data.characters.forEach((char: any) => {
        createCharacter(projectId, {
          name: char.name,
          role: char.role,
          description: char.description,
          imageUri: char.image_uri,
          backstory: char.backstory,
          goals: char.goals,
          traits: char.traits,
        });
      });
    }

    // Import locations
    if (data.locations) {
      data.locations.forEach((loc: any) => {
        createLocation(projectId, {
          name: loc.name,
          description: loc.description,
          imageUri: loc.image_uri,
          notes: loc.notes,
        });
      });
    }

    // Import publishing settings
    if (data.publishingSettings) {
      setPublishingSettings(projectId, {
        isbn: data.publishingSettings.isbn,
        publisher: data.publishingSettings.publisher,
        publicationDate: data.publishingSettings.publication_date,
        price: data.publishingSettings.price,
        language: data.publishingSettings.language,
        copyrightText: data.publishingSettings.copyright_text,
        dedication: data.publishingSettings.dedication,
        acknowledgments: data.publishingSettings.acknowledgments,
        exportFormat: data.publishingSettings.export_format,
      });
    }

    return projectId;
  } catch (error) {
    console.error("Error importing project:", error);
    throw error;
  }
};

// ***************

// ==================== UNIFIED ITEM OPERATIONS ====================

export const createItem = (data: {
  projectId: number;
  parentItemId?: number;
  itemType: string;
  name: string;
  description?: string;
  content?: string;
  metadata?: any;
  orderIndex?: number;
  color?: string;
  icon?: string;
}) => {
  try {
    const now = Date.now();

    // Calculate depth level
    let depthLevel = 0;
    if (data.parentItemId) {
      const parent = db.getFirstSync(
        "SELECT depth_level FROM items WHERE id = ?",
        data.parentItemId
      ) as { depth_level: number } | null;
      depthLevel = (parent?.depth_level || 0) + 1;
    }

    // Calculate word count
    let wordCount = 0;
    let characterCount = 0;
    if (data.content) {
      wordCount = data.content
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0).length;
      characterCount = data.content.length;
    }

    const result = db.runSync(
      `INSERT INTO items (
        project_id, parent_item_id, item_type, name, description, content,
        metadata, order_index, depth_level, color, icon, word_count, character_count,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      data.projectId,
      data.parentItemId || null,
      data.itemType,
      data.name,
      data.description || "",
      data.content || "",
      data.metadata ? JSON.stringify(data.metadata) : null,
      data.orderIndex ?? 0,
      depthLevel,
      data.color || null,
      data.icon || null,
      wordCount,
      characterCount,
      now,
      now
    );

    // Update project word count
    updateProjectWordCount(data.projectId);

    // Add to sync queue
    addToSyncQueue("item", result.lastInsertRowId, "create", data);

    return result.lastInsertRowId;
  } catch (error) {
    console.error("Error creating item:", error);
    throw error;
  }
};

export const getItemsByProject = (projectId: number, itemType?: string) => {
  try {
    if (itemType) {
      return db.getAllSync(
        "SELECT * FROM items WHERE project_id = ? AND item_type = ? ORDER BY order_index ASC",
        projectId,
        itemType
      );
    }
    return db.getAllSync(
      "SELECT * FROM items WHERE project_id = ? ORDER BY order_index ASC",
      projectId
    );
  } catch (error) {
    console.error("Error getting items:", error);
    return [];
  }
};

export const getItemsByParent = (parentItemId: number) => {
  try {
    return db.getAllSync(
      "SELECT * FROM items WHERE parent_item_id = ? ORDER BY order_index ASC",
      parentItemId
    );
  } catch (error) {
    console.error("Error getting child items:", error);
    return [];
  }
};

export const updateItem = (
  id: number,
  data: {
    name?: string;
    description?: string;
    content?: string;
    metadata?: any;
    orderIndex?: number;
    color?: string;
    icon?: string;
    isIncludedInExport?: boolean;
  }
) => {
  try {
    const now = Date.now();
    const updates: string[] = [];
    const values: any[] = [];

    if (data.name !== undefined) {
      updates.push("name = ?");
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push("description = ?");
      values.push(data.description);
    }
    if (data.content !== undefined) {
      updates.push("content = ?");
      values.push(data.content);

      const wordCount = data.content
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 0).length;
      const characterCount = data.content.length;
      updates.push("word_count = ?", "character_count = ?");
      values.push(wordCount, characterCount);
    }
    if (data.metadata !== undefined) {
      updates.push("metadata = ?");
      values.push(JSON.stringify(data.metadata));
    }
    if (data.orderIndex !== undefined) {
      updates.push("order_index = ?");
      values.push(data.orderIndex);
    }
    if (data.color !== undefined) {
      updates.push("color = ?");
      values.push(data.color);
    }
    if (data.icon !== undefined) {
      updates.push("icon = ?");
      values.push(data.icon);
    }
    if (data.isIncludedInExport !== undefined) {
      updates.push("is_included_in_export = ?");
      values.push(data.isIncludedInExport ? 1 : 0);
    }

    updates.push("updated_at = ?");
    values.push(now, id);

    db.runSync(
      `UPDATE items SET ${updates.join(", ")} WHERE id = ?`,
      ...values
    );

    // Update project word count if content changed
    if (data.content !== undefined) {
      const item = db.getFirstSync(
        "SELECT project_id FROM items WHERE id = ?",
        id
      ) as { project_id: number } | null;
      if (item) {
        updateProjectWordCount(item.project_id);
      }
    }

    // Add to sync queue
    addToSyncQueue("item", id, "update", data);
  } catch (error) {
    console.error("Error updating item:", error);
    throw error;
  }
};

export const deleteItem = (id: number) => {
  try {
    const item = db.getFirstSync(
      "SELECT project_id FROM items WHERE id = ?",
      id
    ) as { project_id: number } | null;

    db.runSync("DELETE FROM items WHERE id = ?", id);

    if (item) {
      updateProjectWordCount(item.project_id);
    }

    // Add to sync queue
    addToSyncQueue("item", id, "delete", null);
  } catch (error) {
    console.error("Error deleting item:", error);
    throw error;
  }
};

// ==================== HELPER FUNCTIONS ====================

const updateProjectWordCount = (projectId: number) => {
  try {
    const result = db.getFirstSync(
      "SELECT SUM(word_count) as total FROM items WHERE project_id = ? AND is_included_in_export = 1",
      projectId
    ) as { total: number } | null;

    const wordCount = result?.total || 0;
    const now = Date.now();

    db.runSync(
      "UPDATE projects SET word_count = ?, updated_at = ? WHERE id = ?",
      wordCount,
      now,
      projectId
    );
    
    console.log(`Updated project ${projectId} word count to: ${wordCount}`);
  } catch (error) {
    console.error("Error updating project word count:", error);
  }
};

const addToSyncQueue = (
  entityType: string,
  entityId: number,
  action: string,
  payload: any
) => {
  try {
    const now = Date.now();
    db.runSync(
      "INSERT INTO sync_queue (entity_type, entity_id, action, payload, created_at) VALUES (?, ?, ?, ?, ?)",
      entityType,
      entityId,
      action,
      payload ? JSON.stringify(payload) : null,
      now
    );
  } catch (error) {
    console.error("Error adding to sync queue:", error);
  }
};

// Writing settings operations
export const getWritingSettings = (projectId?: number, userId?: number) => {
  try {
    let query = "SELECT * FROM writing_settings WHERE ";
    const params: any[] = [];

    if (projectId) {
      query += "project_id = ?";
      params.push(projectId);
    } else if (userId) {
      query += "user_id = ?";
      params.push(userId);
    } else {
      return null;
    }

    return db.getFirstSync(query, ...params);
  } catch (error) {
    console.error("Error getting writing settings:", error);
    return null;
  }
};

export const setWritingSetting = (data: {
  projectId?: number;
  userId?: number;
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  textColor?: string;
  backgroundColor?: string;
  paragraphSpacing?: number;
  textAlign?: string;
  pageWidth?: number;
  marginTop?: number;
  marginBottom?: number;
  typewriterMode?: boolean;
  autoSave?: boolean;
  zenMode?: boolean;
}) => {
  try {
    const now = Date.now();
    const existing = getWritingSettings(data.projectId, data.userId);

    if (existing) {
      const updates: string[] = [];
      const values: any[] = [];

      // Add all fields that need updating
      if (data.fontFamily !== undefined) {
        updates.push("font_family = ?");
        values.push(data.fontFamily);
      }
      if (data.fontSize !== undefined) {
        updates.push("font_size = ?");
        values.push(data.fontSize);
      }
      if (data.backgroundColor !== undefined) {
        updates.push("background_color = ?");
        values.push(data.backgroundColor);
      }
      if (data.textColor !== undefined) {
        updates.push("text_color = ?");
        values.push(data.textColor);
      }
      if (data.lineHeight !== undefined) {
        updates.push("line_height = ?");
        values.push(data.lineHeight);
      }
      if (data.textAlign !== undefined) {
        updates.push("text_align = ?");
        values.push(data.textAlign);
      }
      if (data.paragraphSpacing !== undefined) {
        updates.push("paragraph_spacing = ?");
        values.push(data.paragraphSpacing);
      }
      if (data.pageWidth !== undefined) {
        updates.push("page_width = ?");
        values.push(data.pageWidth);
      }

      updates.push("updated_at = ?");
      values.push(now);

      if (data.projectId) {
        values.push(data.projectId);
        db.runSync(
          `UPDATE writing_settings SET ${updates.join(
            ", "
          )} WHERE project_id = ?`,
          ...values
        );
      } else if (data.userId) {
        values.push(data.userId);
        db.runSync(
          `UPDATE writing_settings SET ${updates.join(", ")} WHERE user_id = ?`,
          ...values
        );
      }
    } else {
      db.runSync(
        `INSERT INTO writing_settings (
          project_id, user_id, font_family, font_size, line_height, text_color,
          background_color, paragraph_spacing, text_align, page_width,
          margin_top, margin_bottom, typewriter_mode, auto_save, zen_mode,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        data.projectId || null,
        data.userId || null,
        data.fontFamily || "Georgia",
        data.fontSize || 18,
        data.lineHeight || 1.8,
        data.textColor || "#1F2937",
        data.backgroundColor || "#FFFFFF",
        data.paragraphSpacing || 16,
        data.textAlign || "left",
        data.pageWidth || 650,
        data.marginTop || 40,
        data.marginBottom || 40,
        data.typewriterMode ? 1 : 0,
        data.autoSave !== false ? 1 : 0,
        data.zenMode ? 1 : 0,
        now,
        now
      );
    }
  } catch (error) {
    console.error("Error setting writing settings:", error);
    throw error;
  }
};
