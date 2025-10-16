import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("quilkalam.db");

// Initialize comprehensive database schema
export const initDB = () => {
  try {
    db.execSync("DROP TABLE IF EXISTS projects;");
    // Projects table - Main container for novels/poetry/manuscripts
    db.execSync(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK(type IN ('novel', 'poetry', 'shortStory', 'manuscript')),
        title TEXT NOT NULL,
        description TEXT,
        genre TEXT,
        author_name TEXT,
        writing_template TEXT DEFAULT 'freeform' CHECK(writing_template IN ('freeform', 'heros_journey', 'three_act', 'save_the_cat', 'seven_point')),
        word_count INTEGER DEFAULT 0,
        target_word_count INTEGER,
        status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'in_progress', 'revision', 'complete', 'published')),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);

    // Project covers - Front, back, and spine images
    db.execSync(`
      CREATE TABLE IF NOT EXISTS project_covers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        cover_type TEXT NOT NULL CHECK(cover_type IN ('front', 'back', 'spine')),
        image_uri TEXT NOT NULL,
        image_width INTEGER,
        image_height INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        UNIQUE(project_id, cover_type)
      );
    `);

    // Folders - Organize content hierarchically (chapters, acts, sections)
    db.execSync(`
      CREATE TABLE IF NOT EXISTS folders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        parent_folder_id INTEGER,
        name TEXT NOT NULL,
        description TEXT,
        folder_type TEXT DEFAULT 'chapter' CHECK(folder_type IN ('chapter', 'act', 'part', 'section', 'scene', 'custom')),
        order_index INTEGER NOT NULL DEFAULT 0,
        color TEXT,
        icon TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_folder_id) REFERENCES folders(id) ON DELETE CASCADE
      );
    `);

    // Files - Individual documents and images
    db.execSync(`
      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        folder_id INTEGER,
        file_type TEXT NOT NULL CHECK(file_type IN ('text', 'document', 'image', 'note', 'character', 'location', 'research')),
        name TEXT NOT NULL,
        content TEXT,
        image_uri TEXT,
        word_count INTEGER DEFAULT 0,
        order_index INTEGER NOT NULL DEFAULT 0,
        is_included_in_export BOOLEAN DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
      );
    `);

    // Content page - Auto-generated table of contents
    db.execSync(`
      CREATE TABLE IF NOT EXISTS content_pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        title TEXT DEFAULT 'Table of Contents',
        is_auto_generated BOOLEAN DEFAULT 1,
        custom_content TEXT,
        show_page_numbers BOOLEAN DEFAULT 1,
        show_word_counts BOOLEAN DEFAULT 0,
        style_template TEXT DEFAULT 'classic',
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        UNIQUE(project_id)
      );
    `);

    // Writing templates - Hero's Journey, Three Act Structure, etc.
    db.execSync(`
      CREATE TABLE IF NOT EXISTS template_stages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        template_type TEXT NOT NULL,
        stage_name TEXT NOT NULL,
        stage_description TEXT,
        folder_id INTEGER,
        order_index INTEGER NOT NULL,
        is_completed BOOLEAN DEFAULT 0,
        notes TEXT,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
      );
    `);

    // Formatting styles - Font, colors, styles per project/folder/file
    db.execSync(`
      CREATE TABLE IF NOT EXISTS formatting_styles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER,
        folder_id INTEGER,
        file_id INTEGER,
        scope TEXT NOT NULL CHECK(scope IN ('project', 'folder', 'file')),
        font_family TEXT DEFAULT 'serif',
        font_size INTEGER DEFAULT 16,
        line_height REAL DEFAULT 1.5,
        text_align TEXT DEFAULT 'left' CHECK(text_align IN ('left', 'center', 'right', 'justify')),
        text_color TEXT DEFAULT '#000000',
        background_color TEXT DEFAULT '#FFFFFF',
        heading_font TEXT,
        heading_color TEXT,
        paragraph_spacing INTEGER DEFAULT 12,
        indent_first_line BOOLEAN DEFAULT 1,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
        FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
      );
    `);

    // Characters - Track characters across the story
    db.execSync(`
      CREATE TABLE IF NOT EXISTS characters (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        role TEXT CHECK(role IN ('protagonist', 'antagonist', 'supporting', 'minor')),
        description TEXT,
        image_uri TEXT,
        backstory TEXT,
        goals TEXT,
        traits TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
    `);

    // Locations - World building
    db.execSync(`
      CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        image_uri TEXT,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      );
    `);

    // Publishing settings
    db.execSync(`
      CREATE TABLE IF NOT EXISTS publishing_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        isbn TEXT,
        publisher TEXT,
        publication_date INTEGER,
        price REAL,
        language TEXT DEFAULT 'en',
        copyright_text TEXT,
        dedication TEXT,
        acknowledgments TEXT,
        export_format TEXT DEFAULT 'pdf' CHECK(export_format IN ('pdf', 'epub', 'docx')),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        UNIQUE(project_id)
      );
    `);

    // Create indexes for better performance
    db.execSync(
      "CREATE INDEX IF NOT EXISTS idx_folders_project ON folders(project_id);"
    );
    db.execSync(
      "CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_folder_id);"
    );
    db.execSync(
      "CREATE INDEX IF NOT EXISTS idx_files_project ON files(project_id);"
    );
    db.execSync(
      "CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder_id);"
    );
    db.execSync(
      "CREATE INDEX IF NOT EXISTS idx_characters_project ON characters(project_id);"
    );
    db.execSync(
      "CREATE INDEX IF NOT EXISTS idx_locations_project ON locations(project_id);"
    );

    console.log("Database initialized successfully with enhanced schema");
  } catch (error) {
    console.error("Error initializing database:", error);
    throw error;
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

// ==================== HELPER FUNCTIONS ====================

const updateProjectWordCount = (projectId: number) => {
  try {
    const result = db.getFirstSync(
      "SELECT SUM(word_count) as total FROM files WHERE project_id = ? AND is_included_in_export = 1",
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
  } catch (error) {
    console.error("Error updating project word count:", error);
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
    const folderCount = db.getFirstSync(
      "SELECT COUNT(*) as count FROM folders WHERE project_id = ?",
      projectId
    ) as { count: number } | null;
    const fileCount = db.getFirstSync(
      "SELECT COUNT(*) as count FROM files WHERE project_id = ?",
      projectId
    ) as { count: number } | null;
    const characterCount = db.getFirstSync(
      "SELECT COUNT(*) as count FROM characters WHERE project_id = ?",
      projectId
    ) as { count: number } | null;
    const locationCount = db.getFirstSync(
      "SELECT COUNT(*) as count FROM locations WHERE project_id = ?",
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
        : 0,
      status: project?.status || "draft",
      folderCount: folderCount?.count || 0,
      fileCount: fileCount?.count || 0,
      characterCount: characterCount?.count || 0,
      locationCount: locationCount?.count || 0,
    };
  } catch (error) {
    console.error("Error getting project stats:", error);
    return null;
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
        `UPDATE publishing_settings SET ${updates.join(", ")} WHERE project_id = ?`,
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
