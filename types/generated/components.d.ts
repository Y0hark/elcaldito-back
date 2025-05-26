import type { Schema, Struct } from '@strapi/strapi';

export interface RepeatableTags extends Struct.ComponentSchema {
  collectionName: 'components_repeatable_tags';
  info: {
    displayName: 'tags';
    icon: 'priceTag';
  };
  attributes: {
    name: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'repeatable.tags': RepeatableTags;
    }
  }
}
