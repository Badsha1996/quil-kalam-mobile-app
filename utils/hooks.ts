import {
  createItem,
  deleteItem,
  getItemsByParent,
  getItemsByProject,
  getProject,
  updateItem,
  updateProject,
} from "@/utils/database";
import { useCallback, useEffect, useState } from "react";

// ==================== PROJECT HOOK ====================

export const useProject = (projectId: number) => {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadProject = useCallback(() => {
    if (!projectId) return;
    const data = getProject(projectId);
    setProject(data);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  const update = useCallback(
    (updates: any) => {
      updateProject(projectId, updates);
      loadProject();
    },
    [projectId, loadProject]
  );

  return { project, loading, refresh: loadProject, update };
};

// ==================== ITEMS HOOK ====================

export const useItems = (projectId: number, itemType?: string) => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadItems = useCallback(() => {
    if (!projectId) return;
    const data = getItemsByProject(projectId, itemType);
    setItems(data);
    setLoading(false);
  }, [projectId, itemType]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const create = useCallback(
    (itemData: {
      parentItemId?: number;
      itemType: string;
      name: string;
      description?: string;
      content?: string;
      metadata?: any;
    }) => {
      const id = createItem({
        projectId,
        ...itemData,
      });
      loadItems();
      return id;
    },
    [projectId, loadItems]
  );

  const update = useCallback(
    (itemId: number, updates: any) => {
      updateItem(itemId, updates);
      loadItems();
    },
    [loadItems]
  );

  const remove = useCallback(
    (itemId: number) => {
      deleteItem(itemId);
      loadItems();
    },
    [loadItems]
  );

  return {
    items,
    loading,
    create,
    update,
    remove,
    refresh: loadItems,
  };
};

// ==================== ITEM TREE HOOK ====================

export const useItemTree = (projectId: number) => {
  const [tree, setTree] = useState<any[]>([]);
  const [flatItems, setFlatItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const buildTree = useCallback((items: any[]) => {
    const itemMap = new Map();
    const roots: any[] = [];

    // Create map and parse metadata
    items.forEach((item) => {
      itemMap.set(item.id, {
        ...item,
        metadata: item.metadata ? JSON.parse(item.metadata) : {},
        children: [],
      });
    });

    // Build tree structure
    items.forEach((item) => {
      const node = itemMap.get(item.id);
      if (item.parent_item_id && itemMap.has(item.parent_item_id)) {
        itemMap.get(item.parent_item_id).children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort by order_index
    const sortChildren = (nodes: any[]) => {
      nodes.sort((a, b) => a.order_index - b.order_index);
      nodes.forEach((node) => {
        if (node.children.length > 0) {
          sortChildren(node.children);
        }
      });
    };

    sortChildren(roots);
    return roots;
  }, []);

  const loadTree = useCallback(() => {
    if (!projectId) return;
    const items = getItemsByProject(projectId);
    setFlatItems(items);
    const treeData = buildTree(items);
    setTree(treeData);
    setLoading(false);
  }, [projectId, buildTree]);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  const create = useCallback(
    (itemData: {
      parentItemId?: number;
      itemType: string;
      name: string;
      description?: string;
      content?: string;
      metadata?: any;
    }) => {
      const id = createItem({
        projectId,
        ...itemData,
      });
      loadTree();
      return id;
    },
    [projectId, loadTree]
  );

  const update = useCallback(
    (itemId: number, updates: any) => {
      updateItem(itemId, updates);
      loadTree();
    },
    [loadTree]
  );

  const remove = useCallback(
    (itemId: number) => {
      deleteItem(itemId);
      loadTree();
    },
    [loadTree]
  );

  const move = useCallback(
    (itemId: number, newParentId: number | null, newIndex: number) => {
      // Get siblings
      const siblings = newParentId
        ? flatItems.filter(
            (i) => i.parent_item_id === newParentId && i.id !== itemId
          )
        : flatItems.filter((i) => !i.parent_item_id && i.id !== itemId);

      // Update order indices
      siblings.forEach((sibling, idx) => {
        const targetIdx = idx >= newIndex ? idx + 1 : idx;
        updateItem(sibling.id, { orderIndex: targetIdx });
      });

      // Update moved item
      updateItem(itemId, {
        orderIndex: newIndex,
      });

      // Update parent if changed
      if (newParentId !== undefined) {
        // @ts-ignore
        updateItem(itemId, { parentItemId: newParentId });
      }

      loadTree();
    },
    [flatItems, loadTree]
  );

  const reorder = useCallback(
    (itemId: number, newIndex: number) => {
      const item = flatItems.find((i) => i.id === itemId);
      if (!item) return;

      move(itemId, item.parent_item_id, newIndex);
    },
    [flatItems, move]
  );

  return {
    tree,
    flatItems,
    loading,
    create,
    update,
    remove,
    move,
    reorder,
    refresh: loadTree,
  };
};

// ==================== SPECIFIC ITEM TYPE HOOKS ====================

export const useFolders = (projectId: number) => {
  return useItems(projectId, "folder");
};

export const useChapters = (projectId: number) => {
  return useItems(projectId, "chapter");
};

export const useScenes = (projectId: number) => {
  return useItems(projectId, "scene");
};

export const useCharacters = (projectId: number) => {
  return useItems(projectId, "character");
};

export const useLocations = (projectId: number) => {
  return useItems(projectId, "location");
};

export const useTimelines = (projectId: number) => {
  return useItems(projectId, "timeline");
};

export const useResearch = (projectId: number) => {
  return useItems(projectId, "research");
};

// ==================== ITEM CHILDREN HOOK ====================

export const useItemChildren = (parentItemId: number) => {
  const [children, setChildren] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadChildren = useCallback(() => {
    if (!parentItemId) return;
    const data = getItemsByParent(parentItemId);
    setChildren(data);
    setLoading(false);
  }, [parentItemId]);

  useEffect(() => {
    loadChildren();
  }, [loadChildren]);

  return { children, loading, refresh: loadChildren };
};

// ==================== ITEM METADATA HOOK ====================

export const useItemMetadata = (itemId: number) => {
  const [metadata, setMetadata] = useState<any>({});

  useEffect(() => {
    // Load metadata from item
    const item = getItemsByProject(itemId);
    // @ts-ignore
    if (item && item.metadata) {
      // @ts-ignore
      setMetadata(JSON.parse(item.metadata));
    }
  }, [itemId]);

  const updateMetadata = useCallback(
    (updates: any) => {
      const newMetadata = { ...metadata, ...updates };
      updateItem(itemId, { metadata: newMetadata });
      setMetadata(newMetadata);
    },
    [itemId, metadata]
  );

  const setMetadataField = useCallback(
    (key: string, value: any) => {
      updateMetadata({ [key]: value });
    },
    [updateMetadata]
  );

  const removeMetadataField = useCallback(
    (key: string) => {
      const newMetadata = { ...metadata };
      delete newMetadata[key];
      updateItem(itemId, { metadata: newMetadata });
      setMetadata(newMetadata);
    },
    [itemId, metadata]
  );

  return {
    metadata,
    updateMetadata,
    setMetadataField,
    removeMetadataField,
  };
};

// ==================== SEARCH HOOK ====================

export const useItemSearch = (projectId: number) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(
    (searchQuery: string) => {
      setQuery(searchQuery);
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      const allItems = getItemsByProject(projectId);
      const filtered = allItems.filter((item: any) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(searchLower) ||
          (item.description &&
            item.description.toLowerCase().includes(searchLower)) ||
          (item.content && item.content.toLowerCase().includes(searchLower))
        );
      });
      setResults(filtered);
      setLoading(false);
    },
    [projectId]
  );

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
  }, []);

  return {
    query,
    results,
    loading,
    search,
    clearSearch,
  };
};

// ==================== ITEM STATS HOOK ====================

export const useItemStats = (itemId: number) => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const calculateStats = () => {
      const allItems = getItemsByProject(itemId);
      const item = allItems.find((i: any) => i.id === itemId);

      if (!item) return null;

      // Get all descendants
      const getDescendants = (id: number): any[] => {
        const children = allItems.filter((i: any) => i.parent_item_id === id);
        // @ts-ignore
        return children.reduce((acc, child) => {
          // @ts-ignore
          return [...acc, child, ...getDescendants(child.id)];
        }, [] as any[]);
      };

      const descendants = getDescendants(itemId);
      const totalWordCount =
        // @ts-ignore
        descendants.reduce((sum, i) => sum + (i.word_count || 0), 0) +
        // @ts-ignore
        (item.word_count || 0);
      const totalCharCount =
        descendants.reduce((sum, i) => sum + (i.character_count || 0), 0) +
        // @ts-ignore
        (item.character_count || 0);

      return {
        // @ts-ignore
        wordCount: item.word_count || 0,
        // @ts-ignore
        characterCount: item.character_count || 0,
        totalWordCount,
        totalCharCount,
        childCount: descendants.length,
        // @ts-ignore
        depthLevel: item.depth_level || 0,
      };
    };

    setStats(calculateStats());
  }, [itemId]);

  return stats;
};

// ==================== BULK OPERATIONS HOOK ====================

export const useBulkItems = (projectId: number) => {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const toggleSelect = useCallback((itemId: number) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((itemIds: number[]) => {
    setSelectedIds(new Set(itemIds));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const bulkUpdate = useCallback(
    (updates: any) => {
      selectedIds.forEach((id) => {
        updateItem(id, updates);
      });
      clearSelection();
    },
    [selectedIds, clearSelection]
  );

  const bulkDelete = useCallback(() => {
    selectedIds.forEach((id) => {
      deleteItem(id);
    });
    clearSelection();
  }, [selectedIds, clearSelection]);

  const bulkMove = useCallback(
    (newParentId: number | null) => {
      let orderIndex = 0;
      selectedIds.forEach((id) => {
        // @ts-ignore
        updateItem(id, { parentItemId: newParentId, orderIndex });
        orderIndex++;
      });
      clearSelection();
    },
    [selectedIds, clearSelection]
  );

  return {
    selectedIds: Array.from(selectedIds),
    toggleSelect,
    selectAll,
    clearSelection,
    bulkUpdate,
    bulkDelete,
    bulkMove,
    hasSelection: selectedIds.size > 0,
    selectionCount: selectedIds.size,
  };
};

// ==================== ITEM HISTORY/VERSIONS HOOK ====================

export const useItemVersions = (itemId: number) => {
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVersions = useCallback(() => {
    // Implementation would load from item_versions table
    // Placeholder for now
    setLoading(false);
  }, [itemId]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  const createVersion = useCallback(
    (content: string, metadata?: any) => {
      // Save current state as version
      // Implementation needed
    },
    [itemId]
  );

  const restoreVersion = useCallback(
    (versionId: number) => {
      // Restore item to specific version
      // Implementation needed
    },
    [itemId]
  );

  return {
    versions,
    loading,
    createVersion,
    restoreVersion,
    refresh: loadVersions,
  };
};

// ==================== EXPORT HELPERS ====================

export const useExportableItems = (projectId: number) => {
  const [exportableItems, setExportableItems] = useState<any[]>([]);

  useEffect(() => {
    const items = getItemsByProject(projectId);
    const exportable = items.filter((item: any) => item.is_included_in_export);
    setExportableItems(exportable);
  }, [projectId]);

  const toggleExportable = useCallback(
    (itemId: number, value: boolean) => {
      updateItem(itemId, { isIncludedInExport: value });
      const items = getItemsByProject(projectId);
      const exportable = items.filter(
        (item: any) => item.is_included_in_export
      );
      setExportableItems(exportable);
    },
    [projectId]
  );

  return {
    exportableItems,
    toggleExportable,
  };
};
