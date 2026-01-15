export interface Block {
  ID: number;
  block_name: string;
  block_type: string;
  default_style?: any;
  default_content?: any;
}

export interface SectionBlock {
  ID: number;
  order_index: number;
  layout_type?: string;
  flex_settings?: any;
  position?: any;
  templates_block?: Block;
  templates_section_id?: number;
  templates_block_id?: number;
}

export interface Section {
  ID: number;
  section_name: string;
  section_type?: string;
  section_blocks?: SectionBlock[];
  CreatedAt?: string;
  UpdatedAt?: string;
}

export interface PortfolioSection {
    ID: number;
    section_title: string;
    section_port_key: string;
    section_blocks: any[];
    portfolio_id: number;
    order_index: number;
    is_enabled: boolean;
}