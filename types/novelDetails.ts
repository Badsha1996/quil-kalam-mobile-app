export interface ItemNode {
  id: number;
  name: string;
  item_type: string;
  content?: string;
  metadata?: string;
  parent_item_id?: number;
  order_index: number;
  depth_level: number;
  word_count?: number;
  color?: string;
  icon?: string;
  children?: ItemNode[];
}

export interface WritingSettings {
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  textColor: string;
  backgroundColor: string;
  paragraphSpacing: number;
  textAlign?: "left" | "center" | "right" | "justify";
  marginHorizontal?: number;
}
