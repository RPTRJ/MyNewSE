export interface Block {
  ID: number;
  block_name: string;
  block_type: string;
  default_style: any;
  default_content: any;
}

export interface SectionBlock {
  ID: number;
  order_index: number;
  templates_block: Block;
  layout_type?: string;
  flex_settings?: any;
  grid_settings?: any;
  position?: any;
  custom_style?: any;

}

export interface Section {
  ID: number;
  section_name: string;
  layout_type: string;
  section_blocks: SectionBlock[];
}

export interface TemplateSectionLink {
  ID: number;
  order_index: number;
  templates_section: Section;
}

export interface Template {
  ID: number;
  template_name: string;
  description: string;
  category: string;
  thumbnail: string;
  template_section_links: TemplateSectionLink[];
}