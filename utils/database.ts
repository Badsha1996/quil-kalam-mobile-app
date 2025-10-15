import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('quilkalam.db');

// Initialize database tables
export const initDB = () => {
  try {
    db.execSync(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        genre TEXT,
        content TEXT DEFAULT '',
        word_count INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

// CREATE - Add new project
export const createProject = (
  type: 'novel' | 'poetry',
  title: string,
  description: string,
  genre: string
) => {
  try {
    const now = Date.now();
    const result = db.runSync(
      'INSERT INTO projects (type, title, description, genre, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      type,
      title,
      description,
      genre,
      now,
      now
    );
    return result.lastInsertRowId;
  } catch (error) {
    console.error('Error creating project:', error);
    throw error;
  }
};

// READ ALL - Get all projects
export const getAllProjects = () => {
  try {
    return db.getAllSync('SELECT * FROM projects ORDER BY updated_at DESC');
  } catch (error) {
    console.error('Error getting all projects:', error);
    return [];
  }
};

// READ ONE - Get single project by ID
export const getProject = (id: number) => {
  try {
    return db.getFirstSync('SELECT * FROM projects WHERE id = ?', id);
  } catch (error) {
    console.error('Error getting project:', error);
    return null;
  }
};

// SEARCH - Search projects by title or description
export const searchProjects = (query: string) => {
  try {
    const searchPattern = `%${query}%`;
    return db.getAllSync(
      'SELECT * FROM projects WHERE title LIKE ? OR description LIKE ? ORDER BY updated_at DESC',
      searchPattern,
      searchPattern
    );
  } catch (error) {
    console.error('Error searching projects:', error);
    return [];
  }
};

// FILTER - Get projects by type
export const getProjectsByType = (type: 'novel' | 'poetry') => {
  try {
    return db.getAllSync(
      'SELECT * FROM projects WHERE type = ? ORDER BY updated_at DESC',
      type
    );
  } catch (error) {
    console.error('Error filtering projects:', error);
    return [];
  }
};

// FILTER - Get projects by genre
export const getProjectsByGenre = (genre: string) => {
  try {
    return db.getAllSync(
      'SELECT * FROM projects WHERE genre = ? ORDER BY updated_at DESC',
      genre
    );
  } catch (error) {
    console.error('Error filtering by genre:', error);
    return [];
  }
};

// UPDATE - Update project details
export const updateProject = (
  id: number,
  title: string,
  description: string,
  genre: string,
  content?: string
) => {
  try {
    const now = Date.now();
    if (content !== undefined) {
      const wordCount = content.trim().split(/\s+/).length;
      db.runSync(
        'UPDATE projects SET title = ?, description = ?, genre = ?, content = ?, word_count = ?, updated_at = ? WHERE id = ?',
        title,
        description,
        genre,
        content,
        wordCount,
        now,
        id
      );
    } else {
      db.runSync(
        'UPDATE projects SET title = ?, description = ?, genre = ?, updated_at = ? WHERE id = ?',
        title,
        description,
        genre,
        now,
        id
      );
    }
  } catch (error) {
    console.error('Error updating project:', error);
    throw error;
  }
};

// UPDATE - Update only content
export const updateProjectContent = (id: number, content: string) => {
  try {
    const now = Date.now();
    const wordCount = content.trim().split(/\s+/).length;
    db.runSync(
      'UPDATE projects SET content = ?, word_count = ?, updated_at = ? WHERE id = ?',
      content,
      wordCount,
      now,
      id
    );
  } catch (error) {
    console.error('Error updating content:', error);
    throw error;
  }
};

// DELETE - Delete project
export const deleteProject = (id: number) => {
  try {
    db.runSync('DELETE FROM projects WHERE id = ?', id);
  } catch (error) {
    console.error('Error deleting project:', error);
    throw error;
  }
};

// STATS - Get statistics
export const getStats = () => {
  try {
    const totalProjects = db.getFirstSync('SELECT COUNT(*) as count FROM projects') as { count: number } | undefined;
    const totalNovels = db.getFirstSync('SELECT COUNT(*) as count FROM projects WHERE type = "novel"') as { count: number } | undefined;
    const totalPoetry = db.getFirstSync('SELECT COUNT(*) as count FROM projects WHERE type = "poetry"') as { count: number } | undefined;
    const totalWords = db.getFirstSync('SELECT SUM(word_count) as total FROM projects') as { total: number } | undefined;
    
    return {
      totalProjects: totalProjects?.count || 0,
      totalNovels: totalNovels?.count || 0,
      totalPoetry: totalPoetry?.count || 0,
      totalWords: totalWords?.total || 0,
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return {
      totalProjects: 0,
      totalNovels: 0,
      totalPoetry: 0,
      totalWords: 0,
    };
  }
};