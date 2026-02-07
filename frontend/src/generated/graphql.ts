import { GraphQLClient, RequestOptions } from 'graphql-request';
import gql from 'graphql-tag';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
type GraphQLClientRequestHeaders = RequestOptions['requestHeaders'];
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
};

/** An ability score representing a fundamental character attribute (e.g., Strength, Dexterity). */
export type AbilityScore = {
  __typename?: 'AbilityScore';
  /** A description of the ability score and its applications. */
  desc: Array<Scalars['String']['output']>;
  /** The full name of the ability score (e.g., Strength). */
  full_name: Scalars['String']['output'];
  /** The unique identifier for this ability score (e.g., str). */
  index: Scalars['String']['output'];
  /** The abbreviated name of the ability score (e.g., STR). */
  name: Scalars['String']['output'];
  /** Skills associated with this ability score. */
  skills: Array<Skill>;
  /** Timestamp of the last update. */
  updated_at: Scalars['String']['output'];
};

/** A choice of ability score bonuses for a race */
export type AbilityScoreBonusChoice = {
  __typename?: 'AbilityScoreBonusChoice';
  /** Number of ability score bonuses to choose. */
  choose: Scalars['Int']['output'];
  /** Description of the ability score bonus choice. */
  desc?: Maybe<Scalars['String']['output']>;
  /** The options to choose from. */
  from: AbilityScoreBonusChoiceOptionSet;
  /** Type of ability score bonuses to choose from. */
  type: Scalars['String']['output'];
};

/** A single ability score bonus option */
export type AbilityScoreBonusChoiceOption = {
  __typename?: 'AbilityScoreBonusChoiceOption';
  /** The ability score to increase. */
  ability_score: AbilityScore;
  /** The amount to increase the ability score by. */
  bonus: Scalars['Int']['output'];
  /** The type of option. */
  option_type: Scalars['String']['output'];
};

/** A set of ability score bonus options to choose from */
export type AbilityScoreBonusChoiceOptionSet = {
  __typename?: 'AbilityScoreBonusChoiceOptionSet';
  /** The type of option set. */
  option_set_type: Scalars['String']['output'];
  /** The available options. */
  options: Array<AbilityScoreBonusChoiceOption>;
};

export type AbilityScoreOrder = {
  by: AbilityScoreOrderField;
  direction: OrderByDirection;
  then_by?: InputMaybe<AbilityScoreOrder>;
};

/** Fields to sort Ability Scores by */
export type AbilityScoreOrderField =
  | 'FULL_NAME'
  | 'NAME';

/** Represents an action associated with a trait (like a breath weapon). */
export type Action = {
  __typename?: 'Action';
  /** The area of effect for the action. */
  area_of_effect?: Maybe<AreaOfEffect>;
  /** Damage dealt by the action. */
  damage?: Maybe<Array<ActionDamage>>;
  /** The Difficulty Class (DC) associated with the action (value may not be applicable). */
  dc?: Maybe<TraitActionDc>;
  /** Description of the action. */
  desc: Scalars['String']['output'];
  /** The name of the action. */
  name: Scalars['String']['output'];
  /** Usage limitations for the action. */
  usage?: Maybe<Usage>;
};

/** A choice of actions for a monster */
export type ActionChoice = {
  __typename?: 'ActionChoice';
  /** Number of actions to choose. */
  choose: Scalars['Int']['output'];
  /** Description of the action choice. */
  desc?: Maybe<Scalars['String']['output']>;
  /** The options to choose from. */
  from: ActionChoiceOptionSet;
  /** Type of actions to choose from. */
  type: Scalars['String']['output'];
};

/** A single action option within a choice */
export type ActionChoiceOption = {
  __typename?: 'ActionChoiceOption';
  /** The name of the action. */
  action_name: Scalars['String']['output'];
  /** Number of times the action can be used. */
  count: Scalars['Int']['output'];
  /** Additional notes about the action. */
  notes?: Maybe<Scalars['String']['output']>;
  /** The type of option. */
  option_type: Scalars['String']['output'];
  /** The type of action. */
  type: Scalars['String']['output'];
};

/** A set of action options to choose from */
export type ActionChoiceOptionSet = {
  __typename?: 'ActionChoiceOptionSet';
  /** The type of option set. */
  option_set_type: Scalars['String']['output'];
  /** The available options. */
  options: Array<ActionOptionUnion>;
};

/** Damage details for an action */
export type ActionDamage = {
  __typename?: 'ActionDamage';
  /** Damage scaling based on character level, transformed from the raw data object. */
  damage_at_character_level?: Maybe<Array<LevelValue>>;
  /** The type of damage dealt. */
  damage_type?: Maybe<DamageType>;
};

/** Option within a monster action */
export type ActionOption = {
  __typename?: 'ActionOption';
  /** The name of the action. */
  action_name: Scalars['String']['output'];
  /** Number of times the action can be used. */
  count: Scalars['String']['output'];
  /** The type of action. */
  type: Scalars['String']['output'];
};

export type ActionOptionUnion = ActionChoiceOption | MultipleActionChoiceOption;

/** Usage details for a monster action or ability */
export type ActionUsage = {
  __typename?: 'ActionUsage';
  /** The dice roll for the action usage. */
  dice?: Maybe<Scalars['String']['output']>;
  /** The minimum value for the action usage. */
  min_value?: Maybe<Scalars['Int']['output']>;
  /** The type of action usage. */
  type: Scalars['String']['output'];
};

/** Represents a creature's moral and ethical outlook. */
export type Alignment = {
  __typename?: 'Alignment';
  /** A shortened representation of the alignment (e.g., LG, CE). */
  abbreviation: Scalars['String']['output'];
  /** A brief description of the alignment. */
  desc: Scalars['String']['output'];
  /** The unique identifier for this alignment (e.g., lawful-good). */
  index: Scalars['String']['output'];
  /** The name of the alignment (e.g., Lawful Good, Chaotic Evil). */
  name: Scalars['String']['output'];
  /** Timestamp of the last update. */
  updated_at: Scalars['String']['output'];
};

export type AlignmentOrder = {
  by: AlignmentOrderField;
  direction: OrderByDirection;
  then_by?: InputMaybe<AlignmentOrder>;
};

/** Fields to sort Alignments by */
export type AlignmentOrderField =
  | 'NAME';

/** Represents Ammunition equipment */
export type Ammunition = IEquipment & {
  __typename?: 'Ammunition';
  /** Cost of the equipment in coinage. */
  cost: Cost;
  /** Description of the equipment. */
  desc?: Maybe<Array<Scalars['String']['output']>>;
  /** The category this equipment belongs to. */
  equipment_category: EquipmentCategory;
  /** Category if the equipment is gear. */
  gear_category?: Maybe<EquipmentCategory>;
  /** The unique identifier for this equipment. */
  index: Scalars['String']['output'];
  /** The name of the equipment. */
  name: Scalars['String']['output'];
  properties?: Maybe<Array<WeaponProperty>>;
  /** Quantity of ammunition in the bundle. */
  quantity: Scalars['Int']['output'];
  /** Timestamp of the last update. */
  updated_at: Scalars['String']['output'];
  /** Weight of the equipment in pounds. */
  weight?: Maybe<Scalars['Float']['output']>;
};

export type AnyEquipment = Ammunition | Armor | Gear | Pack | Tool | Vehicle | Weapon;

/** Defines an area of effect for spells or abilities. */
export type AreaOfEffect = {
  __typename?: 'AreaOfEffect';
  /** The size of the area of effect (e.g., radius in feet). */
  size: Scalars['Int']['output'];
  /** The shape of the area of effect. */
  type: Scalars['String']['output'];
};

/** Input for filtering by area of effect properties. */
export type AreaOfEffectFilterInput = {
  /** Filter by area of effect size (in feet). */
  size?: InputMaybe<NumberFilterInput>;
  /** Filter by area of effect type (e.g., ["sphere", "cone"]) */
  type?: InputMaybe<Array<Scalars['String']['input']>>;
};

/** Represents Armor equipment */
export type Armor = IEquipment & {
  __typename?: 'Armor';
  /** Category of armor (e.g., Light, Medium, Heavy). */
  armor_category: Scalars['String']['output'];
  /** Armor export Class details for this armor. */
  armor_class: ArmorClass;
  /** Cost of the equipment in coinage. */
  cost: Cost;
  /** Description of the equipment. */
  desc?: Maybe<Array<Scalars['String']['output']>>;
  /** The category this equipment belongs to. */
  equipment_category: EquipmentCategory;
  /** Category if the equipment is gear. */
  gear_category?: Maybe<EquipmentCategory>;
  /** The unique identifier for this equipment. */
  index: Scalars['String']['output'];
  /** The name of the equipment. */
  name: Scalars['String']['output'];
  properties?: Maybe<Array<WeaponProperty>>;
  /** Whether wearing the armor imposes disadvantage on Stealth checks. */
  stealth_disadvantage?: Maybe<Scalars['Boolean']['output']>;
  /** Minimum Strength score required to use this armor effectively. */
  str_minimum?: Maybe<Scalars['Int']['output']>;
  /** Timestamp of the last update. */
  updated_at: Scalars['String']['output'];
  /** Weight of the equipment in pounds. */
  weight?: Maybe<Scalars['Float']['output']>;
};

/** Details about armor class. */
export type ArmorClass = {
  __typename?: 'ArmorClass';
  /** Base armor class value. */
  base: Scalars['Int']['output'];
  /** Indicates if Dexterity bonus applies. */
  dex_bonus: Scalars['Boolean']['output'];
  /** Maximum Dexterity bonus allowed. */
  max_bonus?: Maybe<Scalars['Int']['output']>;
};

/** Monster Armor Class component: Armor worn */
export type ArmorClassArmor = {
  __typename?: 'ArmorClassArmor';
  armor?: Maybe<Array<Armor>>;
  /** Optional description for this AC component. */
  desc?: Maybe<Scalars['String']['output']>;
  /** Type of AC component: 'armor' */
  type: Scalars['String']['output'];
  /** AC value from worn armor. */
  value: Scalars['Int']['output'];
};

/** Monster Armor Class component: Condition effect */
export type ArmorClassCondition = {
  __typename?: 'ArmorClassCondition';
  /** The condition providing the AC bonus. Resolved via resolver. */
  condition: Condition;
  /** Optional description for this AC component. */
  desc?: Maybe<Scalars['String']['output']>;
  /** Type of AC component: 'condition' */
  type: Scalars['String']['output'];
  /** AC value from condition effect. */
  value: Scalars['Int']['output'];
};

/** Monster Armor Class component: Dexterity based */
export type ArmorClassDex = {
  __typename?: 'ArmorClassDex';
  /** Optional description for this AC component. */
  desc?: Maybe<Scalars['String']['output']>;
  /** Type of AC component: 'dex' */
  type: Scalars['String']['output'];
  /** AC value from dexterity. */
  value: Scalars['Int']['output'];
};

/** Monster Armor Class component: Natural armor */
export type ArmorClassNatural = {
  __typename?: 'ArmorClassNatural';
  /** Optional description for this AC component. */
  desc?: Maybe<Scalars['String']['output']>;
  /** Type of AC component: 'natural' */
  type: Scalars['String']['output'];
  /** AC value from natural armor. */
  value: Scalars['Int']['output'];
};

/** Monster Armor Class component: Spell effect */
export type ArmorClassSpell = {
  __typename?: 'ArmorClassSpell';
  /** Optional description for this AC component. */
  desc?: Maybe<Scalars['String']['output']>;
  /** The spell providing the AC bonus. Resolved via resolver. */
  spell: Spell;
  /** Type of AC component: 'spell' */
  type: Scalars['String']['output'];
  /** AC value from spell effect. */
  value: Scalars['Int']['output'];
};

/** Represents a character background providing flavor, proficiencies, and features. */
export type Background = {
  __typename?: 'Background';
  /** Resolves the bonds choice for the background. */
  bonds?: Maybe<StringChoice>;
  /** The feature associated with this background. */
  feature: BackgroundFeature;
  /** Resolves the flaws choice for the background. */
  flaws?: Maybe<StringChoice>;
  /** Resolves the ideals choice for the background. */
  ideals?: Maybe<IdealChoice>;
  /** The unique identifier for this background (e.g., acolyte). */
  index: Scalars['String']['output'];
  /** Resolves the language choices for the background. */
  language_options?: Maybe<LanguageChoice>;
  /** The name of the background (e.g., Acolyte). */
  name: Scalars['String']['output'];
  /** Resolves the personality traits choice for the background. */
  personality_traits?: Maybe<StringChoice>;
  /** Equipment received when choosing this background. */
  starting_equipment: Array<EquipmentRef>;
  /** Resolves starting equipment choices for the background. */
  starting_equipment_options?: Maybe<Array<StartingEquipmentChoice>>;
  /** Proficiencies granted by this background at start. */
  starting_proficiencies: Array<Proficiency>;
  /** Timestamp of the last update. */
  updated_at: Scalars['String']['output'];
};

/** A special feature granted by the background. */
export type BackgroundFeature = {
  __typename?: 'BackgroundFeature';
  /** The description of the background feature. */
  desc: Array<Scalars['String']['output']>;
  /** The name of the background feature. */
  name: Scalars['String']['output'];
};

export type BackgroundOrder = {
  by: BackgroundOrderField;
  direction: OrderByDirection;
  then_by?: InputMaybe<BackgroundOrder>;
};

/** Fields to sort Backgrounds by */
export type BackgroundOrderField =
  | 'NAME';

/** A choice of breath options for a monster action */
export type BreathChoice = {
  __typename?: 'BreathChoice';
  /** Number of breath options to choose. */
  choose: Scalars['Int']['output'];
  /** Description of the breath choice. */
  desc?: Maybe<Scalars['String']['output']>;
  /** The options to choose from. */
  from: BreathChoiceOptionSet;
  /** Type of breath options to choose from. */
  type: Scalars['String']['output'];
};

/** A single breath option within a breath choice */
export type BreathChoiceOption = {
  __typename?: 'BreathChoiceOption';
  /** The damage dealt by the breath. */
  damage?: Maybe<Array<Damage>>;
  /** The difficulty class for the breath. */
  dc: DifficultyClass;
  /** The name of the breath option. */
  name: Scalars['String']['output'];
  /** The type of option (e.g., breath). */
  option_type: Scalars['String']['output'];
};

/** A set of breath options to choose from */
export type BreathChoiceOptionSet = {
  __typename?: 'BreathChoiceOptionSet';
  /** The type of option set. */
  option_set_type: Scalars['String']['output'];
  /** The available breath options. */
  options: Array<BreathChoiceOption>;
};

/** Represents a character class (e.g., Barbarian, Wizard) */
export type Class = {
  __typename?: 'Class';
  /** All levels for this class, detailing features and abilities gained. */
  class_levels: Array<Level>;
  /** Hit die size for the class (e.g., 6, 8, 10, 12) */
  hit_die: Scalars['Int']['output'];
  /** Unique identifier for the class */
  index: Scalars['String']['output'];
  /** Multi-classing requirements and features for this class. */
  multi_classing?: Maybe<MultiClassing>;
  /** Name of the class */
  name: Scalars['String']['output'];
  /** Base proficiencies granted by this class. */
  proficiencies?: Maybe<Array<Proficiency>>;
  proficiency_choices: Array<ProficiencyChoice>;
  /** Saving throw proficiencies granted by this class. */
  saving_throws?: Maybe<Array<AbilityScore>>;
  /** Spellcasting details for the class. */
  spellcasting?: Maybe<Spellcasting>;
  /** Spells available to this class. */
  spells: Array<Spell>;
  /** Starting equipment for the class. */
  starting_equipment?: Maybe<Array<ClassEquipment>>;
  /** Resolves starting equipment choices for the class. */
  starting_equipment_options?: Maybe<Array<StartingEquipmentChoice>>;
  /** Available subclasses for this class. */
  subclasses?: Maybe<Array<Subclass>>;
  /** Timestamp of the last update */
  updated_at: Scalars['String']['output'];
};

/** Starting equipment item for a class */
export type ClassEquipment = {
  __typename?: 'ClassEquipment';
  equipment?: Maybe<AnyEquipment>;
  /** Quantity of the equipment item. */
  quantity: Scalars['Int']['output'];
};

export type ClassOrder = {
  by: ClassOrderField;
  direction: OrderByDirection;
  then_by?: InputMaybe<ClassOrder>;
};

/** Fields to sort Classes by */
export type ClassOrderField =
  | 'HIT_DIE'
  | 'NAME';

/** Class-specific features and values gained at a level */
export type ClassSpecific = {
  __typename?: 'ClassSpecific';
  /** Number of Action Surges available. */
  action_surges?: Maybe<Scalars['Int']['output']>;
  /** Maximum spell level recoverable via Arcane Recovery. */
  arcane_recovery_levels?: Maybe<Scalars['Int']['output']>;
  /** Range of Paladin auras in feet. */
  aura_range?: Maybe<Scalars['Int']['output']>;
  /** Die size for Bardic Inspiration (e.g., 6 for d6). */
  bardic_inspiration_die?: Maybe<Scalars['Int']['output']>;
  /** Number of extra damage dice for Barbarian's Brutal Critical. */
  brutal_critical_dice?: Maybe<Scalars['Int']['output']>;
  /** Number of uses for Channel Divinity. */
  channel_divinity_charges?: Maybe<Scalars['Int']['output']>;
  /** Sorcerer spell slot creation options. */
  creating_spell_slots?: Maybe<Array<ClassSpecificCreatingSpellSlot>>;
  /** Maximum Challenge Rating of undead that can be destroyed by Channel Divinity. */
  destroy_undead_cr?: Maybe<Scalars['Float']['output']>;
  /** Number of extra attacks granted. */
  extra_attacks?: Maybe<Scalars['Int']['output']>;
  /** Number of favored enemies known by Ranger. */
  favored_enemies?: Maybe<Scalars['Int']['output']>;
  /** Number of favored terrains known by Ranger. */
  favored_terrain?: Maybe<Scalars['Int']['output']>;
  /** Number of uses for Fighter's Indomitable feature. */
  indomitable_uses?: Maybe<Scalars['Int']['output']>;
  /** Number of Warlock invocations known. */
  invocations_known?: Maybe<Scalars['Int']['output']>;
  /** Number of Monk ki points. */
  ki_points?: Maybe<Scalars['Int']['output']>;
  /** Maximum level of spells gained via Bard's Magical Secrets (up to level 5). */
  magical_secrets_max_5?: Maybe<Scalars['Int']['output']>;
  /** Maximum level of spells gained via Bard's Magical Secrets (up to level 7). */
  magical_secrets_max_7?: Maybe<Scalars['Int']['output']>;
  /** Maximum level of spells gained via Bard's Magical Secrets (up to level 9). */
  magical_secrets_max_9?: Maybe<Scalars['Int']['output']>;
  /** Monk martial arts damage progression. */
  martial_arts?: Maybe<ClassSpecificMartialArt>;
  /** Number of Sorcerer metamagic options known. */
  metamagic_known?: Maybe<Scalars['Int']['output']>;
  /** Indicates if Warlock gained level 6 Mystic Arcanum (1 = yes). */
  mystic_arcanum_level_6?: Maybe<Scalars['Int']['output']>;
  /** Indicates if Warlock gained level 7 Mystic Arcanum (1 = yes). */
  mystic_arcanum_level_7?: Maybe<Scalars['Int']['output']>;
  /** Indicates if Warlock gained level 8 Mystic Arcanum (1 = yes). */
  mystic_arcanum_level_8?: Maybe<Scalars['Int']['output']>;
  /** Indicates if Warlock gained level 9 Mystic Arcanum (1 = yes). */
  mystic_arcanum_level_9?: Maybe<Scalars['Int']['output']>;
  /** Number of Barbarian rages per long rest. */
  rage_count?: Maybe<Scalars['Int']['output']>;
  /** Damage bonus added to Barbarian rage attacks. */
  rage_damage_bonus?: Maybe<Scalars['Int']['output']>;
  /** Rogue sneak attack damage progression. */
  sneak_attack?: Maybe<ClassSpecificSneakAttack>;
  /** Die size for Bard's Song of Rest (e.g., 6 for d6). */
  song_of_rest_die?: Maybe<Scalars['Int']['output']>;
  /** Number of Sorcerer sorcery points. */
  sorcery_points?: Maybe<Scalars['Int']['output']>;
  /** Bonus speed for Monk's Unarmored Movement in feet. */
  unarmored_movement?: Maybe<Scalars['Int']['output']>;
  /** Indicates if Druid's Wild Shape allows flying. */
  wild_shape_fly?: Maybe<Scalars['Boolean']['output']>;
  /** Maximum Challenge Rating for Druid's Wild Shape form. */
  wild_shape_max_cr?: Maybe<Scalars['Float']['output']>;
  /** Indicates if Druid's Wild Shape allows swimming. */
  wild_shape_swim?: Maybe<Scalars['Boolean']['output']>;
};

/** Spell slot creation details for Sorcerer levels */
export type ClassSpecificCreatingSpellSlot = {
  __typename?: 'ClassSpecificCreatingSpellSlot';
  /** Cost in sorcery points. */
  sorcery_point_cost: Scalars['Int']['output'];
  /** Level of the spell slot created. */
  spell_slot_level: Scalars['Int']['output'];
};

/** Martial arts details for Monk levels */
export type ClassSpecificMartialArt = {
  __typename?: 'ClassSpecificMartialArt';
  /** Number of dice for martial arts damage. */
  dice_count: Scalars['Int']['output'];
  /** Value of the dice used (e.g., 4 for d4). */
  dice_value: Scalars['Int']['output'];
};

/** Sneak attack details for Rogue levels */
export type ClassSpecificSneakAttack = {
  __typename?: 'ClassSpecificSneakAttack';
  /** Number of dice for sneak attack damage. */
  dice_count: Scalars['Int']['output'];
  /** Value of the dice used (e.g., 6 for d6). */
  dice_value: Scalars['Int']['output'];
};

/** A state that can affect a creature, such as Blinded or Prone. */
export type Condition = {
  __typename?: 'Condition';
  /** A description of the effects of the condition. */
  desc: Array<Scalars['String']['output']>;
  /** The unique identifier for this condition (e.g., blinded). */
  index: Scalars['String']['output'];
  /** The name of the condition (e.g., Blinded). */
  name: Scalars['String']['output'];
  /** Timestamp of the last update. */
  updated_at: Scalars['String']['output'];
};

export type ConditionOrder = {
  by: ConditionOrderField;
  direction: OrderByDirection;
  then_by?: InputMaybe<ConditionOrder>;
};

/** Fields to sort Conditions by */
export type ConditionOrderField =
  | 'NAME';

/** An item and its quantity within a container or bundle. */
export type Content = {
  __typename?: 'Content';
  /** Resolves the APIReference to the actual Equipment. */
  item?: Maybe<AnyEquipment>;
  /** The quantity of the item. */
  quantity: Scalars['Int']['output'];
};

/** Cost of an item in coinage. */
export type Cost = {
  __typename?: 'Cost';
  /** The quantity of coins. */
  quantity: Scalars['Int']['output'];
  /** The unit of coinage (e.g., gp, sp, cp). */
  unit: Scalars['String']['output'];
};

/** Represents a specific piece of equipment with a quantity. */
export type CountedReferenceOption = {
  __typename?: 'CountedReferenceOption';
  /** The quantity of the equipment. */
  count: Scalars['Int']['output'];
  /** The referenced equipment item. */
  of: Equipment;
  /** The type of this option, e.g., 'counted_reference'. */
  option_type: Scalars['String']['output'];
  /** Prerequisites for choosing this option. */
  prerequisites?: Maybe<Array<ProficiencyPrerequisite>>;
};

/** Represents damage dealt by an ability, spell, or weapon. */
export type Damage = {
  __typename?: 'Damage';
  /** The damage dice roll (e.g., 3d6). */
  damage_dice: Scalars['String']['output'];
  /** The type of damage. */
  damage_type?: Maybe<DamageType>;
};

/** A choice of damage options */
export type DamageChoice = {
  __typename?: 'DamageChoice';
  /** The number of options to choose. */
  choose: Scalars['Float']['output'];
  /** The description of the choice. */
  desc?: Maybe<Scalars['String']['output']>;
  /** The options to choose from. */
  from: DamageChoiceOptionSet;
  /** The type of choice. */
  type: Scalars['String']['output'];
};

/** A single damage option in a damage choice */
export type DamageChoiceOption = {
  __typename?: 'DamageChoiceOption';
  /** The damage for this option. */
  damage: Damage;
  /** The type of option. */
  option_type: Scalars['String']['output'];
};

/** A set of damage options */
export type DamageChoiceOptionSet = {
  __typename?: 'DamageChoiceOptionSet';
  /** The type of option set. */
  option_set_type: Scalars['String']['output'];
  /** The options in this set. */
  options: Array<DamageChoiceOption>;
};

export type DamageOrDamageChoice = Damage | DamageChoice;

/** Represents a type of damage (e.g., Acid, Bludgeoning, Fire). */
export type DamageType = {
  __typename?: 'DamageType';
  /** A description of the damage type. */
  desc: Array<Scalars['String']['output']>;
  /** The unique identifier for this damage type (e.g., acid). */
  index: Scalars['String']['output'];
  /** The name of the damage type (e.g., Acid). */
  name: Scalars['String']['output'];
  /** Timestamp of the last update. */
  updated_at: Scalars['String']['output'];
};

export type DamageTypeOrder = {
  by: DamageTypeOrderField;
  direction: OrderByDirection;
  then_by?: InputMaybe<DamageTypeOrder>;
};

/** Fields to sort Damage Types by */
export type DamageTypeOrderField =
  | 'NAME';

/** Represents a Difficulty Class (DC) for saving throws or ability checks where a value is expected. */
export type DifficultyClass = {
  __typename?: 'DifficultyClass';
  /** The ability score associated with this DC. */
  dc_type: AbilityScore;
  /** The value of the DC. */
  dc_value: Scalars['Int']['output'];
  /** The result of a successful save against this DC. */
  success_type: Scalars['String']['output'];
};

/** Base Equipment class for common fields, potentially used in Unions. */
export type Equipment = {
  __typename?: 'Equipment';
  /** Cost of the equipment in coinage. */
  cost: Cost;
  /** Description of the equipment. */
  desc?: Maybe<Array<Scalars['String']['output']>>;
  /** The category this equipment belongs to. */
  equipment_category: EquipmentCategory;
  /** Category if the equipment is gear. */
  gear_category?: Maybe<EquipmentCategory>;
  /** The unique identifier for this equipment. */
  index: Scalars['String']['output'];
  /** The name of the equipment. */
  name: Scalars['String']['output'];
  properties?: Maybe<Array<WeaponProperty>>;
  /** Timestamp of the last update. */
  updated_at: Scalars['String']['output'];
  /** Weight of the equipment in pounds. */
  weight?: Maybe<Scalars['Float']['output']>;
};

/** A category for grouping equipment (e.g., Weapon, Armor, Adventuring Gear). */
export type EquipmentCategory = {
  __typename?: 'EquipmentCategory';
  equipment: Array<EquipmentOrMagicItem>;
  /** The unique identifier for this category (e.g., weapon). */
  index: Scalars['String']['output'];
  /** The name of the category (e.g., Weapon). */
  name: Scalars['String']['output'];
  /** Timestamp of the last update. */
  updated_at: Scalars['String']['output'];
};

/** Details of a choice limited to an equipment category. */
export type EquipmentCategoryChoice = {
  __typename?: 'EquipmentCategoryChoice';
  /** Number of items to choose from the category. */
  choose: Scalars['Int']['output'];
  /** An optional description for this choice. */
  desc?: Maybe<Scalars['String']['output']>;
  /** The equipment category to choose from. */
  from: EquipmentCategorySet;
  /** Type of choice, e.g., 'equipment'. */
  type: Scalars['String']['output'];
};

/** An option that represents a choice from a single equipment category. */
export type EquipmentCategoryChoiceOption = {
  __typename?: 'EquipmentCategoryChoiceOption';
  /** The details of the choice from an equipment category. */
  choice: EquipmentCategoryChoice;
  /** The type of this option, e.g., 'choice' or 'equipment_category_choice'. */
  option_type: Scalars['String']['output'];
};

export type EquipmentCategoryOrder = {
  by: EquipmentCategoryOrderField;
  direction: OrderByDirection;
  then_by?: InputMaybe<EquipmentCategoryOrder>;
};

/** Fields to sort Equipment Categories by */
export type EquipmentCategoryOrderField =
  | 'NAME';

/** A set of equipment choices derived directly from an equipment category. */
export type EquipmentCategorySet = {
  __typename?: 'EquipmentCategorySet';
  /** The equipment category to choose from. */
  equipment_category: EquipmentCategory;
  /** Indicates the type of option set, e.g., 'equipment_category'. */
  option_set_type: Scalars['String']['output'];
};

/** A set of explicitly listed equipment options. */
export type EquipmentOptionSet = {
  __typename?: 'EquipmentOptionSet';
  /** Indicates the type of option set, e.g., 'options_array'. */
  option_set_type: Scalars['String']['output'];
  /** A list of specific equipment options. */
  options: Array<EquipmentOptionUnion>;
};

export type EquipmentOptionUnion = CountedReferenceOption | EquipmentCategoryChoiceOption | MultipleItemsOption;

export type EquipmentOrMagicItem = Ammunition | Armor | Gear | MagicItem | Pack | Tool | Vehicle | Weapon;

export type EquipmentOrder = {
  by: EquipmentOrderField;
  direction: OrderByDirection;
  then_by?: InputMaybe<EquipmentOrder>;
};

/** Fields to sort Equipment by */
export type EquipmentOrderField =
  | 'COST_QUANTITY'
  | 'NAME'
  | 'WEIGHT';

/** Reference to a piece of equipment with a quantity. */
export type EquipmentRef = {
  __typename?: 'EquipmentRef';
  /** The specific equipment referenced. */
  equipment: Equipment;
  /** The quantity of the referenced equipment. */
  quantity: Scalars['Int']['output'];
};

/** A feat representing a special talent or expertise giving unique capabilities. */
export type Feat = {
  __typename?: 'Feat';
  /** A description of the benefits conferred by the feat. */
  desc: Array<Scalars['String']['output']>;
  /** The unique identifier for this feat (e.g., grappler). */
  index: Scalars['String']['output'];
  /** The name of the feat (e.g., Grappler). */
  name: Scalars['String']['output'];
  /** Prerequisites that must be met to take the feat. */
  prerequisites: Array<Prerequisite>;
  /** Timestamp of the last update. */
  updated_at: Scalars['String']['output'];
};

export type FeatOrder = {
  by: FeatOrderField;
  direction: OrderByDirection;
  then_by?: InputMaybe<FeatOrder>;
};

/** Fields to sort Feats by */
export type FeatOrderField =
  | 'NAME';

/** Represents a class or subclass feature. */
export type Feature = {
  __typename?: 'Feature';
  /** The class that gains this feature. */
  class?: Maybe<Class>;
  /** Description of the feature. */
  desc: Array<Scalars['String']['output']>;
  /** Specific details for this feature, if applicable. */
  feature_specific?: Maybe<FeatureSpecific>;
  /** Unique identifier for this feature. */
  index: Scalars['String']['output'];
  /** Level at which the feature is gained. */
  level: Scalars['Int']['output'];
  /** Name of the feature. */
  name: Scalars['String']['output'];
  /** A parent feature, if applicable. */
  parent?: Maybe<Feature>;
  /** Resolves the prerequisites array, fetching referenced Features or Spells. */
  prerequisites?: Maybe<Array<FeaturePrerequisiteUnion>>;
  /** Reference information (e.g., book and page number). */
  reference?: Maybe<Scalars['String']['output']>;
  /** The subclass that gains this feature, if applicable. */
  subclass?: Maybe<Subclass>;
  /** Timestamp of the last update. */
  updated_at: Scalars['String']['output'];
};

export type FeatureOrder = {
  by: FeatureOrderField;
  direction: OrderByDirection;
  then_by?: InputMaybe<FeatureOrder>;
};

/** Fields to sort Features by */
export type FeatureOrderField =
  | 'CLASS'
  | 'LEVEL'
  | 'NAME'
  | 'SUBCLASS';

/** Prerequisite based on having another feature */
export type FeaturePrerequisite = {
  __typename?: 'FeaturePrerequisite';
  /** The specific feature required. */
  feature: Feature;
  /** Type indicator for this prerequisite. */
  type: Scalars['String']['output'];
};

export type FeaturePrerequisiteUnion = FeaturePrerequisite | LevelPrerequisite | SpellPrerequisite;

/** Specific details related to a feature */
export type FeatureSpecific = {
  __typename?: 'FeatureSpecific';
  /** Invocations related to this feature. */
  invocations?: Maybe<Array<Feature>>;
};

/** Represents Gear equipment (general purpose) */
export type Gear = IEquipment & {
  __typename?: 'Gear';
  /** Cost of the equipment in coinage. */
  cost: Cost;
  /** Description of the equipment. */
  desc?: Maybe<Array<Scalars['String']['output']>>;
  /** The category this equipment belongs to. */
  equipment_category: EquipmentCategory;
  /** Category if the equipment is gear. */
  gear_category?: Maybe<EquipmentCategory>;
  /** The unique identifier for this equipment. */
  index: Scalars['String']['output'];
  /** The name of the equipment. */
  name: Scalars['String']['output'];
  properties?: Maybe<Array<WeaponProperty>>;
  /** Timestamp of the last update. */
  updated_at: Scalars['String']['output'];
  /** Weight of the equipment in pounds. */
  weight?: Maybe<Scalars['Float']['output']>;
};

/** Common fields shared by all types of equipment and magic items. */
export type IEquipment = {
  /** Cost of the equipment in coinage. */
  cost: Cost;
  /** Description of the equipment. */
  desc?: Maybe<Array<Scalars['String']['output']>>;
  /** The unique identifier for this equipment. */
  index: Scalars['String']['output'];
  /** The name of the equipment. */
  name: Scalars['String']['output'];
  /** Weight of the equipment in pounds. */
  weight?: Maybe<Scalars['Float']['output']>;
};

/** Represents the choice structure for background ideals. */
export type IdealChoice = {
  __typename?: 'IdealChoice';
  /** The number of ideals to choose from this list. */
  choose: Scalars['Int']['output'];
  /** The set of ideal options available. */
  from: IdealOptionSet;
  /** The type of choice (e.g., ideals). */
  type: Scalars['String']['output'];
};

/** Represents a single ideal option for a background. */
export type IdealOption = {
  __typename?: 'IdealOption';
  /** Alignments associated with this ideal. */
  alignments: Array<Alignment>;
  /** The description of the ideal. */
  desc: Scalars['String']['output'];
  /** The type of the ideal option (e.g., ideal). */
  option_type: Scalars['String']['output'];
};

/** Represents a set of ideal options for a background. */
export type IdealOptionSet = {
  __typename?: 'IdealOptionSet';
  /** The type of the ideal option set (e.g., options_array). */
  option_set_type: Scalars['String']['output'];
  /** The list of ideal options available. */
  options: Array<IdealOption>;
};

/** Represents a language spoken in the D&D world. */
export type Language = {
  __typename?: 'Language';
  /** A brief description of the language. */
  desc?: Maybe<Scalars['String']['output']>;
  /** The unique identifier for this language (e.g., common). */
  index: Scalars['String']['output'];
  /** The name of the language (e.g., Common). */
  name: Scalars['String']['output'];
  /** The script used to write the language (e.g., Common, Elvish). */
  script?: Maybe<Scalars['String']['output']>;
  /** The type of language (e.g., Standard, Exotic). */
  type: Scalars['String']['output'];
  /** Typical speakers of the language. */
  typical_speakers: Array<Scalars['String']['output']>;
  /** Timestamp of the last update. */
  updated_at: Scalars['String']['output'];
};

/** Represents a choice from a list of languages. */
export type LanguageChoice = {
  __typename?: 'LanguageChoice';
  /** The number of languages to choose from this list. */
  choose: Scalars['Int']['output'];
  /** The set of language options available. */
  from: LanguageChoiceOptionSet;
  /** The type of choice (e.g., languages). */
  type: Scalars['String']['output'];
};

/** Represents a reference to a language within a choice option set. */
export type LanguageChoiceOption = {
  __typename?: 'LanguageChoiceOption';
  /** The resolved Language object. */
  item: Language;
  /** The type of this option (e.g., "reference"). */
  option_type: Scalars['String']['output'];
};

/** Represents a set of language options for a choice. */
export type LanguageChoiceOptionSet = {
  __typename?: 'LanguageChoiceOptionSet';
  /** The type of the option set (e.g., resource_list, options_array). */
  option_set_type: Scalars['String']['output'];
  /** The list of language options available. */
  options: Array<LanguageChoiceOption>;
};

export type LanguageOrder = {
  by: LanguageOrderField;
  direction: OrderByDirection;
  then_by?: InputMaybe<LanguageOrder>;
};

/** Fields to sort Languages by */
export type LanguageOrderField =
  | 'NAME'
  | 'SCRIPT'
  | 'TYPE';

/** A legendary action a monster can perform */
export type LegendaryAction = {
  __typename?: 'LegendaryAction';
  /** The attack bonus for the legendary action. */
  attack_bonus?: Maybe<Scalars['Int']['output']>;
  /** The damage for the legendary action. */
  damage?: Maybe<Array<Damage>>;
  /** The difficulty class for the legendary action. */
  dc?: Maybe<DifficultyClass>;
  /** The description of the legendary action. */
  desc: Scalars['String']['output'];
  /** The name of the legendary action. */
  name: Scalars['String']['output'];
};

/** Represents the features and abilities gained at a specific class level */
export type Level = {
  __typename?: 'Level';
  /** Number of ability score bonuses gained at this level */
  ability_score_bonuses?: Maybe<Scalars['Int']['output']>;
  /** The class this level belongs to. */
  class?: Maybe<Class>;
  /** Class-specific details for this level. */
  class_specific?: Maybe<ClassSpecific>;
  /** Features gained at this level. */
  features?: Maybe<Array<Feature>>;
  /** Unique identifier for this level (e.g., barbarian-1, rogue-20) */
  index: Scalars['String']['output'];
  /** The class level (1-20) */
  level: Scalars['Int']['output'];
  /** Proficiency bonus gained at this level */
  prof_bonus?: Maybe<Scalars['Int']['output']>;
  /** Spellcasting progression details for this level. */
  spellcasting?: Maybe<LevelSpellcasting>;
  /** The subclass this level relates to, if applicable. */
  subclass?: Maybe<Subclass>;
  /** Subclass-specific details for this level. */
  subclass_specific?: Maybe<SubclassSpecific>;
  /** Timestamp of the last update */
  updated_at: Scalars['String']['output'];
};

export type LevelOrder = {
  by: LevelOrderField;
  direction: OrderByDirection;
  then_by?: InputMaybe<LevelOrder>;
};

/** Fields to sort Levels by */
export type LevelOrderField =
  | 'CLASS'
  | 'LEVEL'
  | 'SUBCLASS';

/** Prerequisite based on character level */
export type LevelPrerequisite = {
  __typename?: 'LevelPrerequisite';
  /** The character level required. */
  level: Scalars['Int']['output'];
  /** Type indicator for this prerequisite. */
  type: Scalars['String']['output'];
};

/** Spellcasting details for a class at a specific level */
export type LevelSpellcasting = {
  __typename?: 'LevelSpellcasting';
  /** Number of cantrips known. */
  cantrips_known?: Maybe<Scalars['Int']['output']>;
  /** Number of level 1 spell slots. */
  spell_slots_level_1: Scalars['Int']['output'];
  /** Number of level 2 spell slots. */
  spell_slots_level_2: Scalars['Int']['output'];
  /** Number of level 3 spell slots. */
  spell_slots_level_3: Scalars['Int']['output'];
  /** Number of level 4 spell slots. */
  spell_slots_level_4: Scalars['Int']['output'];
  /** Number of level 5 spell slots. */
  spell_slots_level_5: Scalars['Int']['output'];
  /** Number of level 6 spell slots. */
  spell_slots_level_6?: Maybe<Scalars['Int']['output']>;
  /** Number of level 7 spell slots. */
  spell_slots_level_7?: Maybe<Scalars['Int']['output']>;
  /** Number of level 8 spell slots. */
  spell_slots_level_8?: Maybe<Scalars['Int']['output']>;
  /** Number of level 9 spell slots. */
  spell_slots_level_9?: Maybe<Scalars['Int']['output']>;
  /** Total number of spells known (for certain classes like Sorcerer). */
  spells_known?: Maybe<Scalars['Int']['output']>;
};

/** A key-value pair representing a value at a specific level. */
export type LevelValue = {
  __typename?: 'LevelValue';
  /** The level. */
  level: Scalars['Int']['output'];
  /** The value associated with the level. */
  value: Scalars['String']['output'];
};

/** An item imbued with magical properties. */
export type MagicItem = {
  __typename?: 'MagicItem';
  /** A description of the magic item, including its effects and usage. */
  desc: Array<Scalars['String']['output']>;
  /** The category of equipment this magic item belongs to. */
  equipment_category: EquipmentCategory;
  /** URL of an image for the magic item, if available. */
  image?: Maybe<Scalars['String']['output']>;
  /** The unique identifier for this magic item (e.g., adamantite-armor). */
  index: Scalars['String']['output'];
  /** The name of the magic item (e.g., Adamantite Armor). */
  name: Scalars['String']['output'];
  /** The rarity of the magic item. */
  rarity: Rarity;
  /** Timestamp of the last update. */
  updated_at: Scalars['String']['output'];
  /** Indicates if this magic item is a variant of another item. */
  variant: Scalars['Boolean']['output'];
  /** Other magic items that are variants of this item. */
  variants?: Maybe<Array<MagicItem>>;
};

export type MagicItemOrder = {
  by: MagicItemOrderField;
  direction: OrderByDirection;
  then_by?: InputMaybe<MagicItemOrder>;
};

/** Fields to sort Magic Items by */
export type MagicItemOrderField =
  | 'EQUIPMENT_CATEGORY'
  | 'NAME'
  | 'RARITY';

/** A school of magic, representing a particular tradition like Evocation or Illusion. */
export type MagicSchool = {
  __typename?: 'MagicSchool';
  /** A brief description of the school of magic. */
  desc: Scalars['String']['output'];
  /** The unique identifier for this school (e.g., evocation). */
  index: Scalars['String']['output'];
  /** The name of the school (e.g., Evocation). */
  name: Scalars['String']['output'];
  /** Timestamp of the last update. */
  updated_at: Scalars['String']['output'];
};

export type MagicSchoolOrder = {
  by: MagicSchoolOrderField;
  direction: OrderByDirection;
  then_by?: InputMaybe<MagicSchoolOrder>;
};

/** Fields to sort Magic Schools by */
export type MagicSchoolOrderField =
  | 'NAME';

/** A D&D monster. */
export type Monster = {
  __typename?: 'Monster';
  /** The actions for the monster. */
  actions?: Maybe<Array<MonsterAction>>;
  alignment: Scalars['String']['output'];
  armor_class: Array<MonsterArmorClass>;
  challenge_rating: Scalars['Float']['output'];
  charisma: Scalars['Int']['output'];
  /** Conditions the monster is immune to. */
  condition_immunities?: Maybe<Array<Condition>>;
  constitution: Scalars['Int']['output'];
  damage_immunities: Array<Scalars['String']['output']>;
  damage_resistances: Array<Scalars['String']['output']>;
  damage_vulnerabilities: Array<Scalars['String']['output']>;
  dexterity: Scalars['Int']['output'];
  /** Other forms the monster can assume. */
  forms?: Maybe<Array<Monster>>;
  hit_dice: Scalars['String']['output'];
  hit_points: Scalars['Int']['output'];
  hit_points_roll: Scalars['String']['output'];
  image?: Maybe<Scalars['String']['output']>;
  index: Scalars['String']['output'];
  intelligence: Scalars['Int']['output'];
  languages: Scalars['String']['output'];
  /** The legendary actions for the monster. */
  legendary_actions?: Maybe<Array<LegendaryAction>>;
  name: Scalars['String']['output'];
  /** The proficiencies for the monster. */
  proficiencies?: Maybe<Array<MonsterProficiency>>;
  /** The reactions for the monster. */
  reactions?: Maybe<Array<Reaction>>;
  senses: Sense;
  size: Scalars['String']['output'];
  /** The special abilities for the monster. */
  special_abilities?: Maybe<Array<SpecialAbility>>;
  speed: MonsterSpeed;
  strength: Scalars['Int']['output'];
  subtype?: Maybe<Scalars['String']['output']>;
  type: Scalars['String']['output'];
  updated_at: Scalars['String']['output'];
  wisdom: Scalars['Int']['output'];
  xp: Scalars['Int']['output'];
};

/** An action a monster can perform */
export type MonsterAction = {
  __typename?: 'MonsterAction';
  action_options?: Maybe<ActionChoice>;
  /** The actions for the action. */
  actions?: Maybe<Array<ActionOption>>;
  /** The attack bonus for the action. */
  attack_bonus?: Maybe<Scalars['Int']['output']>;
  damage?: Maybe<Array<DamageOrDamageChoice>>;
  /** The difficulty class for the action. */
  dc?: Maybe<DifficultyClass>;
  /** The description of the action. */
  desc: Scalars['String']['output'];
  /** The type of multiattack for the action. */
  multiattack_type?: Maybe<Scalars['String']['output']>;
  /** The name of the action. */
  name: Scalars['String']['output'];
  options?: Maybe<BreathChoice>;
  /** The usage for the action. */
  usage?: Maybe<ActionUsage>;
};

export type MonsterArmorClass = ArmorClassArmor | ArmorClassCondition | ArmorClassDex | ArmorClassNatural | ArmorClassSpell;

export type MonsterOrder = {
  by: MonsterOrderField;
  direction: OrderByDirection;
  then_by?: InputMaybe<MonsterOrder>;
};

/** Fields to sort Monsters by */
export type MonsterOrderField =
  | 'CHALLENGE_RATING'
  | 'CHARISMA'
  | 'CONSTITUTION'
  | 'DEXTERITY'
  | 'INTELLIGENCE'
  | 'NAME'
  | 'SIZE'
  | 'STRENGTH'
  | 'TYPE'
  | 'WISDOM';

/** A monster's specific proficiency and its bonus value. */
export type MonsterProficiency = {
  __typename?: 'MonsterProficiency';
  /** The specific proficiency (e.g., Saving Throw: STR, Skill: Athletics). */
  proficiency: Proficiency;
  /** The proficiency bonus value for this monster. */
  value: Scalars['Int']['output'];
};

/** Monster movement speeds */
export type MonsterSpeed = {
  __typename?: 'MonsterSpeed';
  burrow?: Maybe<Scalars['String']['output']>;
  climb?: Maybe<Scalars['String']['output']>;
  fly?: Maybe<Scalars['String']['output']>;
  hover?: Maybe<Scalars['Boolean']['output']>;
  swim?: Maybe<Scalars['String']['output']>;
  walk?: Maybe<Scalars['String']['output']>;
};

/** Multi-classing requirements and features for a class */
export type MultiClassing = {
  __typename?: 'MultiClassing';
  prerequisite_options: PrerequisiteChoice;
  /** Ability score prerequisites for multi-classing. */
  prerequisites?: Maybe<Array<MultiClassingPrereq>>;
  /** Proficiencies gained when multi-classing into this class. */
  proficiencies?: Maybe<Array<Proficiency>>;
  proficiency_choices: Array<ProficiencyChoice>;
};

/** Prerequisite for multi-classing */
export type MultiClassingPrereq = {
  __typename?: 'MultiClassingPrereq';
  /** The ability score required. */
  ability_score?: Maybe<AbilityScore>;
  /** The minimum score required. */
  minimum_score: Scalars['Int']['output'];
};

/** A multiple action option containing a set of actions */
export type MultipleActionChoiceOption = {
  __typename?: 'MultipleActionChoiceOption';
  /** The set of actions in this option. */
  items: Array<ActionChoiceOption>;
  /** The type of option. */
  option_type: Scalars['String']['output'];
};

export type MultipleItemUnion = CountedReferenceOption | EquipmentCategoryChoiceOption;

/** Represents a bundle of multiple equipment items or equipment category choices. */
export type MultipleItemsOption = {
  __typename?: 'MultipleItemsOption';
  /** The list of items or category choices included in this bundle. */
  items: Array<MultipleItemUnion>;
  /** The type of this option, e.g., 'multiple'. */
  option_type: Scalars['String']['output'];
};

/** Input for filtering by an integer, an array of integers, or a range of integers. */
export type NumberFilterInput = {
  /** Matches an exact integer value. */
  eq?: InputMaybe<Scalars['Int']['input']>;
  /** Matches any integer value in the provided list. */
  in?: InputMaybe<Array<Scalars['Int']['input']>>;
  /** Matches no integer value in the provided list. */
  nin?: InputMaybe<Array<Scalars['Int']['input']>>;
  /** Matches integer values within a specified range. */
  range?: InputMaybe<NumberRangeFilterInput>;
};

/** Input for filtering integer fields, allowing exact match, a list of matches, or a range. */
export type NumberRangeFilterInput = {
  /** Matches values greater than. */
  gt?: InputMaybe<Scalars['Int']['input']>;
  /** Matches values greater than or equal to. */
  gte?: InputMaybe<Scalars['Int']['input']>;
  /** Matches values less than. */
  lt?: InputMaybe<Scalars['Int']['input']>;
  /** Matches values less than or equal to. */
  lte?: InputMaybe<Scalars['Int']['input']>;
};

/** Specifies the direction for ordering results. */
export type OrderByDirection =
  | 'ASC'
  | 'DESC';

/** Represents Gear that contains other items (e.g., Explorer's Pack) */
export type Pack = IEquipment & {
  __typename?: 'Pack';
  /** Items contained within the pack. */
  contents?: Maybe<Array<Content>>;
  /** Cost of the equipment in coinage. */
  cost: Cost;
  /** Description of the equipment. */
  desc?: Maybe<Array<Scalars['String']['output']>>;
  /** The category this equipment belongs to. */
  equipment_category: EquipmentCategory;
  /** Category if the equipment is gear. */
  gear_category?: Maybe<EquipmentCategory>;
  /** The unique identifier for this equipment. */
  index: Scalars['String']['output'];
  /** The name of the equipment. */
  name: Scalars['String']['output'];
  properties?: Maybe<Array<WeaponProperty>>;
  /** Timestamp of the last update. */
  updated_at: Scalars['String']['output'];
  /** Weight of the equipment in pounds. */
  weight?: Maybe<Scalars['Float']['output']>;
};

/** A prerequisite for taking a feat, usually a minimum ability score. */
export type Prerequisite = {
  __typename?: 'Prerequisite';
  /** The ability score required for this prerequisite. */
  ability_score?: Maybe<AbilityScore>;
  /** The minimum score required in the referenced ability score. */
  minimum_score: Scalars['Int']['output'];
};

/** A choice of prerequisites for multi-classing */
export type PrerequisiteChoice = {
  __typename?: 'PrerequisiteChoice';
  /** Number of prerequisites to choose. */
  choose: Scalars['Int']['output'];
  /** Description of the prerequisite choice. */
  desc?: Maybe<Scalars['String']['output']>;
  /** The options to choose from. */
  from: PrerequisiteChoiceOptionSet;
  /** Type of prerequisites to choose from. */
  type: Scalars['String']['output'];
};

/** A single prerequisite option */
export type PrerequisiteChoiceOption = {
  __typename?: 'PrerequisiteChoiceOption';
  /** The ability score required. */
  ability_score: AbilityScore;
  /** The minimum score required. */
  minimum_score: Scalars['Int']['output'];
  /** The type of option. */
  option_type: Scalars['String']['output'];
};

/** A set of prerequisite options to choose from */
export type PrerequisiteChoiceOptionSet = {
  __typename?: 'PrerequisiteChoiceOptionSet';
  /** The type of option set. */
  option_set_type: Scalars['String']['output'];
  /** The available options. */
  options: Array<PrerequisiteChoiceOption>;
};

/** Represents a skill, tool, weapon, armor, or saving throw proficiency. */
export type Proficiency = {
  __typename?: 'Proficiency';
  /** Classes that grant this proficiency. */
  classes?: Maybe<Array<Class>>;
  /** Unique identifier for this proficiency. */
  index: Scalars['String']['output'];
  /** Name of the proficiency. */
  name: Scalars['String']['output'];
  /** Races that grant this proficiency. */
  races?: Maybe<Array<Race>>;
  reference?: Maybe<ProficiencyReference>;
  /** Category of proficiency (e.g., Armor, Weapons, Saving Throws, Skills). */
  type: Scalars['String']['output'];
  /** Timestamp of the last update. */
  updated_at: Scalars['String']['output'];
};

/** Represents a choice from a list of Proficiencies or nested ProficiencyChoices. */
export type ProficiencyChoice = {
  __typename?: 'ProficiencyChoice';
  /** The number of Proficiencies to choose from this list. */
  choose: Scalars['Int']['output'];
  /** Description of the choice. */
  desc?: Maybe<Scalars['String']['output']>;
  /** The set of Proficiency options available. */
  from: ProficiencyChoiceOptionSet;
  /** The type of choice (e.g., proficiencies). */
  type: Scalars['String']['output'];
};

export type ProficiencyChoiceItem = Proficiency | ProficiencyChoice;

/** Represents a reference to a Proficiency or nested ProficiencyChoice within a choice option set. */
export type ProficiencyChoiceOption = {
  __typename?: 'ProficiencyChoiceOption';
  /** The resolved Proficiency object or nested ProficiencyChoice. */
  item: ProficiencyChoiceItem;
  /** The type of this option (e.g., "reference", "choice"). */
  option_type: Scalars['String']['output'];
};

/** Represents a set of Proficiency options for a choice. */
export type ProficiencyChoiceOptionSet = {
  __typename?: 'ProficiencyChoiceOptionSet';
  /** The type of the option set (e.g., resource_list, options_array). */
  option_set_type: Scalars['String']['output'];
  /** The list of Proficiency options available. */
  options: Array<ProficiencyChoiceOption>;
};

export type ProficiencyOrder = {
  by: ProficiencyOrderField;
  direction: OrderByDirection;
  then_by?: InputMaybe<ProficiencyOrder>;
};

/** Fields to sort Proficiencies by */
export type ProficiencyOrderField =
  | 'NAME'
  | 'TYPE';

/** A prerequisite for an equipment option, typically requiring a specific proficiency. */
export type ProficiencyPrerequisite = {
  __typename?: 'ProficiencyPrerequisite';
  /** The specific proficiency required. */
  proficiency: Proficiency;
  /** The type of prerequisite, e.g., 'proficiency'. */
  type: Scalars['String']['output'];
};

export type ProficiencyReference = AbilityScore | Equipment | EquipmentCategory | Skill;

export type Query = {
  __typename?: 'Query';
  /** Gets a single ability score by index. */
  abilityScore?: Maybe<AbilityScore>;
  /** Gets all ability scores, optionally filtered by name and sorted. */
  abilityScores: Array<AbilityScore>;
  /** Gets a single alignment by index. */
  alignment?: Maybe<Alignment>;
  /** Gets all alignments, optionally filtered by name and sorted. */
  alignments: Array<Alignment>;
  /** Gets a single background by index. */
  background?: Maybe<Background>;
  /** Gets all backgrounds, optionally filtered by name and sorted by name. */
  backgrounds: Array<Background>;
  /** Gets a single class by its index. */
  class?: Maybe<Class>;
  /** Gets all classes, optionally filtering by name or hit die and sorted. */
  classes: Array<Class>;
  /** Gets a single condition by index. */
  condition?: Maybe<Condition>;
  /** Gets all conditions, optionally filtered by name and sorted by name. */
  conditions: Array<Condition>;
  /** Gets a single damage type by index. */
  damageType?: Maybe<DamageType>;
  /** Gets all damage types, optionally filtered by name and sorted by name. */
  damageTypes: Array<DamageType>;
  /** Gets a single piece of equipment by its index. */
  equipment?: Maybe<AnyEquipment>;
  /** Gets all equipment categories, optionally filtered by name and sorted by name. */
  equipmentCategories: Array<EquipmentCategory>;
  /** Gets a single equipment category by index. */
  equipmentCategory?: Maybe<EquipmentCategory>;
  /** Gets all equipment, optionally filtered and sorted. */
  equipments: Array<AnyEquipment>;
  /** Gets a single feat by index. */
  feat?: Maybe<Feat>;
  /** Gets all feats, optionally filtered by name and sorted by name. */
  feats: Array<Feat>;
  /** Gets a single feature by its index. */
  feature?: Maybe<Feature>;
  /** Gets all features, optionally filtered and sorted. */
  features: Array<Feature>;
  /** Gets a single language by its index. */
  language?: Maybe<Language>;
  /** Gets all languages, optionally filtered and sorted. */
  languages: Array<Language>;
  /** Gets a single level by its combined index (e.g., wizard-3-evocation or fighter-5). */
  level?: Maybe<Level>;
  /** Gets all levels, optionally filtered and sorted. */
  levels: Array<Level>;
  /** Gets a single magic item by index. */
  magicItem?: Maybe<MagicItem>;
  /** Gets all magic items, optionally filtered and sorted. */
  magicItems: Array<MagicItem>;
  /** Gets a single magic school by index. */
  magicSchool?: Maybe<MagicSchool>;
  /** Gets all magic schools, optionally filtered by name and sorted by name. */
  magicSchools: Array<MagicSchool>;
  /** Gets a single monster by its index. */
  monster?: Maybe<Monster>;
  /** Gets all monsters, optionally filtered and sorted. */
  monsters: Array<Monster>;
  /** Query all Proficiencies, optionally filtered and sorted. */
  proficiencies: Array<Proficiency>;
  /** Gets a single proficiency by index. */
  proficiency?: Maybe<Proficiency>;
  /** Gets a single race by its index. */
  race?: Maybe<Race>;
  /** Gets all races, optionally filtered by name and sorted. */
  races: Array<Race>;
  /** Gets a single rule by index. */
  rule?: Maybe<Rule>;
  /** Gets a single rule section by index. */
  ruleSection?: Maybe<RuleSection>;
  /** Gets all rule sections, optionally filtered by name and sorted by name. */
  ruleSections: Array<RuleSection>;
  /** Gets all rules, optionally filtered by name and sorted by name. */
  rules: Array<Rule>;
  /** Gets a single skill by index. */
  skill?: Maybe<Skill>;
  /** Gets all skills, optionally filtered by name and sorted by name. */
  skills: Array<Skill>;
  /** Gets a single spell by its index. */
  spell?: Maybe<Spell>;
  /** Gets all spells, optionally filtered and sorted. */
  spells: Array<Spell>;
  /** Gets a single subclass by its index. */
  subclass?: Maybe<Subclass>;
  /** Gets all subclasses, optionally filtered by name and sorted. */
  subclasses: Array<Subclass>;
  /** Gets a single subrace by index. */
  subrace?: Maybe<Subrace>;
  /** Gets all subraces, optionally filtered by name and sorted by name. */
  subraces: Array<Subrace>;
  /** Gets a single trait by index. */
  trait?: Maybe<Trait>;
  /** Gets all traits, optionally filtered by name and sorted by name. */
  traits: Array<Trait>;
  /** Gets all weapon properties, optionally filtered by name and sorted by name. */
  weaponProperties: Array<WeaponProperty>;
  /** Gets a single weapon property by index. */
  weaponProperty?: Maybe<WeaponProperty>;
};


export type QueryAbilityScoreArgs = {
  index: Scalars['String']['input'];
};


export type QueryAbilityScoresArgs = {
  full_name?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<AbilityScoreOrder>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryAlignmentArgs = {
  index: Scalars['String']['input'];
};


export type QueryAlignmentsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<AlignmentOrder>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryBackgroundArgs = {
  index: Scalars['String']['input'];
};


export type QueryBackgroundsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<BackgroundOrder>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryClassArgs = {
  index: Scalars['String']['input'];
};


export type QueryClassesArgs = {
  hit_die?: InputMaybe<NumberFilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<ClassOrder>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryConditionArgs = {
  index: Scalars['String']['input'];
};


export type QueryConditionsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<ConditionOrder>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryDamageTypeArgs = {
  index: Scalars['String']['input'];
};


export type QueryDamageTypesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<DamageTypeOrder>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryEquipmentArgs = {
  index: Scalars['String']['input'];
};


export type QueryEquipmentCategoriesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<EquipmentCategoryOrder>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryEquipmentCategoryArgs = {
  index: Scalars['String']['input'];
};


export type QueryEquipmentsArgs = {
  equipment_category?: InputMaybe<Array<Scalars['String']['input']>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<EquipmentOrder>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryFeatArgs = {
  index: Scalars['String']['input'];
};


export type QueryFeatsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<FeatOrder>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryFeatureArgs = {
  index: Scalars['String']['input'];
};


export type QueryFeaturesArgs = {
  class?: InputMaybe<Array<Scalars['String']['input']>>;
  level?: InputMaybe<NumberFilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<FeatureOrder>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subclass?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type QueryLanguageArgs = {
  index: Scalars['String']['input'];
};


export type QueryLanguagesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<LanguageOrder>;
  script?: InputMaybe<Array<Scalars['String']['input']>>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};


export type QueryLevelArgs = {
  index: Scalars['String']['input'];
};


export type QueryLevelsArgs = {
  ability_score_bonuses?: InputMaybe<Scalars['Int']['input']>;
  class?: InputMaybe<Array<Scalars['String']['input']>>;
  level?: InputMaybe<NumberFilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  order?: InputMaybe<LevelOrder>;
  prof_bonus?: InputMaybe<Scalars['Int']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subclass?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type QueryMagicItemArgs = {
  index: Scalars['String']['input'];
};


export type QueryMagicItemsArgs = {
  equipment_category?: InputMaybe<Array<Scalars['String']['input']>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<MagicItemOrder>;
  rarity?: InputMaybe<Array<Scalars['String']['input']>>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryMagicSchoolArgs = {
  index: Scalars['String']['input'];
};


export type QueryMagicSchoolsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<MagicSchoolOrder>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryMonsterArgs = {
  index: Scalars['String']['input'];
};


export type QueryMonstersArgs = {
  challenge_rating?: InputMaybe<NumberFilterInput>;
  charisma?: InputMaybe<NumberFilterInput>;
  condition_immunities?: InputMaybe<Array<Scalars['String']['input']>>;
  constitution?: InputMaybe<NumberFilterInput>;
  damage_immunities?: InputMaybe<Array<Scalars['String']['input']>>;
  damage_resistances?: InputMaybe<Array<Scalars['String']['input']>>;
  damage_vulnerabilities?: InputMaybe<Array<Scalars['String']['input']>>;
  dexterity?: InputMaybe<NumberFilterInput>;
  intelligence?: InputMaybe<NumberFilterInput>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<MonsterOrder>;
  size?: InputMaybe<Scalars['String']['input']>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  strength?: InputMaybe<NumberFilterInput>;
  subtype?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  wisdom?: InputMaybe<NumberFilterInput>;
  xp?: InputMaybe<NumberFilterInput>;
};


export type QueryProficienciesArgs = {
  class?: InputMaybe<Array<Scalars['String']['input']>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<ProficiencyOrder>;
  race?: InputMaybe<Array<Scalars['String']['input']>>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  type?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type QueryProficiencyArgs = {
  index: Scalars['String']['input'];
};


export type QueryRaceArgs = {
  index: Scalars['String']['input'];
};


export type QueryRacesArgs = {
  ability_bonus?: InputMaybe<Array<Scalars['String']['input']>>;
  language?: InputMaybe<Array<Scalars['String']['input']>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<RaceOrder>;
  size?: InputMaybe<Array<Scalars['String']['input']>>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  speed?: InputMaybe<NumberFilterInput>;
};


export type QueryRuleArgs = {
  index: Scalars['String']['input'];
};


export type QueryRuleSectionArgs = {
  index: Scalars['String']['input'];
};


export type QueryRuleSectionsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<RuleSectionOrder>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryRulesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<RuleOrder>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QuerySkillArgs = {
  index: Scalars['String']['input'];
};


export type QuerySkillsArgs = {
  ability_score?: InputMaybe<Array<Scalars['String']['input']>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<SkillOrder>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QuerySpellArgs = {
  index: Scalars['String']['input'];
};


export type QuerySpellsArgs = {
  area_of_effect?: InputMaybe<AreaOfEffectFilterInput>;
  attack_type?: InputMaybe<Array<Scalars['String']['input']>>;
  casting_time?: InputMaybe<Array<Scalars['String']['input']>>;
  class?: InputMaybe<Array<Scalars['String']['input']>>;
  concentration?: InputMaybe<Scalars['Boolean']['input']>;
  damage_type?: InputMaybe<Array<Scalars['String']['input']>>;
  dc_type?: InputMaybe<Array<Scalars['String']['input']>>;
  level?: InputMaybe<Array<Scalars['Int']['input']>>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<SpellOrder>;
  range?: InputMaybe<Array<Scalars['String']['input']>>;
  ritual?: InputMaybe<Scalars['Boolean']['input']>;
  school?: InputMaybe<Array<Scalars['String']['input']>>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  subclass?: InputMaybe<Array<Scalars['String']['input']>>;
};


export type QuerySubclassArgs = {
  index: Scalars['String']['input'];
};


export type QuerySubclassesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<SubclassOrder>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QuerySubraceArgs = {
  index: Scalars['String']['input'];
};


export type QuerySubracesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<SubraceOrder>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryTraitArgs = {
  index: Scalars['String']['input'];
};


export type QueryTraitsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<TraitOrder>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryWeaponPropertiesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<WeaponPropertyOrder>;
  skip?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryWeaponPropertyArgs = {
  index: Scalars['String']['input'];
};

/** Represents a playable race in D&D */
export type Race = {
  __typename?: 'Race';
  ability_bonus_options?: Maybe<AbilityScoreBonusChoice>;
  /** Ability score bonuses granted by this race. */
  ability_bonuses: Array<RaceAbilityBonus>;
  /** Typical age range and lifespan for the race */
  age: Scalars['String']['output'];
  /** Typical alignment tendencies for the race */
  alignment: Scalars['String']['output'];
  /** The index of the race. */
  index: Scalars['String']['output'];
  /** Description of languages typically spoken by the race */
  language_desc: Scalars['String']['output'];
  language_options?: Maybe<LanguageChoice>;
  /** Languages typically spoken by this race. */
  languages?: Maybe<Array<Language>>;
  /** The name of the race. */
  name: Scalars['String']['output'];
  /** Size category (e.g., Medium, Small) */
  size: Scalars['String']['output'];
  /** Description of the race's size */
  size_description: Scalars['String']['output'];
  /** Base walking speed in feet */
  speed: Scalars['Int']['output'];
  /** Subraces available for this race. */
  subraces?: Maybe<Array<Subrace>>;
  /** Traits common to this race. */
  traits?: Maybe<Array<Trait>>;
  /** Timestamp of the last update */
  updated_at: Scalars['String']['output'];
};

/** Ability score bonus provided by a race */
export type RaceAbilityBonus = {
  __typename?: 'RaceAbilityBonus';
  /** The ability score that receives the bonus. */
  ability_score?: Maybe<AbilityScore>;
  /** The bonus value for the ability score */
  bonus: Scalars['Int']['output'];
};

export type RaceOrder = {
  by: RaceOrderField;
  direction: OrderByDirection;
  then_by?: InputMaybe<RaceOrder>;
};

/** Fields to sort Races by */
export type RaceOrderField =
  | 'NAME';

/** Range of a weapon (normal and long). */
export type Range = {
  __typename?: 'Range';
  /** The long range of the weapon. */
  long?: Maybe<Scalars['Int']['output']>;
  /** The normal range of the weapon. */
  normal: Scalars['Int']['output'];
};

/** Rarity level of a magic item. */
export type Rarity = {
  __typename?: 'Rarity';
  /** The name of the rarity level (e.g., Common, Uncommon, Rare). */
  name: Scalars['String']['output'];
};

/** A reaction a monster can perform */
export type Reaction = {
  __typename?: 'Reaction';
  /** The difficulty class for the reaction. */
  dc?: Maybe<DifficultyClass>;
  /** The description of the reaction. */
  desc: Scalars['String']['output'];
  /** The name of the reaction. */
  name: Scalars['String']['output'];
};

/** A specific rule from the SRD. */
export type Rule = {
  __typename?: 'Rule';
  /** A description of the rule. */
  desc: Scalars['String']['output'];
  /** The unique identifier for this rule (e.g., adventuring). */
  index: Scalars['String']['output'];
  /** The name of the rule (e.g., Adventuring). */
  name: Scalars['String']['output'];
  /** Subsections clarifying or detailing this rule. */
  subsections: Array<RuleSection>;
  /** Timestamp of the last update. */
  updated_at: Scalars['String']['output'];
};

export type RuleOrder = {
  by: RuleOrderField;
  direction: OrderByDirection;
  then_by?: InputMaybe<RuleOrder>;
};

/** Fields to sort Rules by */
export type RuleOrderField =
  | 'NAME';

/** Represents a named section of the SRD rules document. */
export type RuleSection = {
  __typename?: 'RuleSection';
  /** A description of the rule section. */
  desc: Scalars['String']['output'];
  /** The unique identifier for this rule section (e.g., ability-checks). */
  index: Scalars['String']['output'];
  /** The name of the rule section (e.g., Ability Checks). */
  name: Scalars['String']['output'];
  /** Timestamp of the last update. */
  updated_at: Scalars['String']['output'];
};

export type RuleSectionOrder = {
  by: RuleSectionOrderField;
  direction: OrderByDirection;
  then_by?: InputMaybe<RuleSectionOrder>;
};

/** Fields to sort Rule Sections by */
export type RuleSectionOrderField =
  | 'NAME';

/** Monster senses details */
export type Sense = {
  __typename?: 'Sense';
  blindsight?: Maybe<Scalars['String']['output']>;
  darkvision?: Maybe<Scalars['String']['output']>;
  passive_perception: Scalars['Int']['output'];
  tremorsense?: Maybe<Scalars['String']['output']>;
  truesight?: Maybe<Scalars['String']['output']>;
};

/** A skill representing proficiency in a specific task (e.g., Athletics, Stealth). */
export type Skill = {
  __typename?: 'Skill';
  /** The ability score associated with this skill. */
  ability_score: AbilityScore;
  /** A description of the skill. */
  desc: Array<Scalars['String']['output']>;
  /** The unique identifier for this skill (e.g., athletics). */
  index: Scalars['String']['output'];
  /** The name of the skill (e.g., Athletics). */
  name: Scalars['String']['output'];
  /** Timestamp of the last update. */
  updated_at: Scalars['String']['output'];
};

export type SkillOrder = {
  by: SkillOrderField;
  direction: OrderByDirection;
  then_by?: InputMaybe<SkillOrder>;
};

/** Fields to sort Skills by */
export type SkillOrderField =
  | 'ABILITY_SCORE'
  | 'NAME';

/** A special ability of the monster */
export type SpecialAbility = {
  __typename?: 'SpecialAbility';
  /** The attack bonus for the special ability. */
  attack_bonus?: Maybe<Scalars['Int']['output']>;
  /** The damage for the special ability. */
  damage?: Maybe<Array<Damage>>;
  /** The difficulty class for the special ability. */
  dc?: Maybe<DifficultyClass>;
  /** The description of the special ability. */
  desc: Scalars['String']['output'];
  /** The name of the special ability. */
  name: Scalars['String']['output'];
  /** The spellcasting for the special ability. */
  spellcasting?: Maybe<SpecialAbilitySpellcasting>;
  /** The usage for the special ability. */
  usage?: Maybe<SpecialAbilityUsage>;
};

/** A spell within a monster's special ability spellcasting */
export type SpecialAbilitySpell = {
  __typename?: 'SpecialAbilitySpell';
  /** The level of the spell. */
  level: Scalars['Int']['output'];
  /** The notes for the spell. */
  notes?: Maybe<Scalars['String']['output']>;
  /** The resolved spell object. */
  spell: Spell;
  /** The usage for the spell. */
  usage?: Maybe<SpecialAbilityUsage>;
};

/** Spellcasting details for a monster special ability */
export type SpecialAbilitySpellcasting = {
  __typename?: 'SpecialAbilitySpellcasting';
  /** The ability for the spellcasting. */
  ability: AbilityScore;
  /** The components required for the spellcasting. */
  components_required: Array<Scalars['String']['output']>;
  /** The difficulty class for the spellcasting. */
  dc?: Maybe<Scalars['Int']['output']>;
  /** The level of the spellcasting. */
  level?: Maybe<Scalars['Int']['output']>;
  /** The modifier for the spellcasting. */
  modifier?: Maybe<Scalars['Int']['output']>;
  /** The school of the spellcasting. */
  school?: Maybe<Scalars['String']['output']>;
  slots?: Maybe<Array<SpellSlotCount>>;
  /** The spells for the spellcasting. */
  spells: Array<SpecialAbilitySpell>;
};

/** Usage details for a special ability */
export type SpecialAbilityUsage = {
  __typename?: 'SpecialAbilityUsage';
  /** The types of rest the special ability can be used on. */
  rest_types?: Maybe<Array<Scalars['String']['output']>>;
  /** The number of times the special ability can be used. */
  times?: Maybe<Scalars['Int']['output']>;
  /** The type of usage for the special ability. */
  type: Scalars['String']['output'];
};

/** Speed of a mount or vehicle. */
export type Speed = {
  __typename?: 'Speed';
  /** The speed quantity. */
  quantity: Scalars['Float']['output'];
  /** The unit of speed (e.g., ft./round). */
  unit: Scalars['String']['output'];
};

/** Represents a spell in D&D */
export type Spell = {
  __typename?: 'Spell';
  /** Area of effect details, if applicable. */
  area_of_effect?: Maybe<AreaOfEffect>;
  /** Type of attack associated with the spell (e.g., Melee, Ranged) */
  attack_type?: Maybe<Scalars['String']['output']>;
  /** Time required to cast the spell */
  casting_time: Scalars['String']['output'];
  /** Classes that can cast this spell. */
  classes?: Maybe<Array<Class>>;
  /** Components required for the spell (V, S, M) */
  components: Array<Scalars['String']['output']>;
  /** Indicates if the spell requires concentration */
  concentration: Scalars['Boolean']['output'];
  /** Damage details, if applicable. */
  damage?: Maybe<SpellDamage>;
  /** Saving throw details, if applicable. */
  dc?: Maybe<SpellDc>;
  /** Description of the spell's effects */
  desc: Array<Scalars['String']['output']>;
  /** Duration of the spell */
  duration: Scalars['String']['output'];
  /** Healing amount based on spell slot level, transformed from raw data. */
  heal_at_slot_level?: Maybe<Array<LevelValue>>;
  /** Description of effects when cast at higher levels */
  higher_level?: Maybe<Array<Scalars['String']['output']>>;
  /** Unique identifier for this spell */
  index: Scalars['String']['output'];
  /** Level of the spell (0 for cantrips) */
  level: Scalars['Int']['output'];
  /** Material components required, if any */
  material?: Maybe<Scalars['String']['output']>;
  /** Name of the spell */
  name: Scalars['String']['output'];
  /** Range of the spell */
  range: Scalars['String']['output'];
  /** Indicates if the spell can be cast as a ritual */
  ritual: Scalars['Boolean']['output'];
  /** The school of magic this spell belongs to. */
  school?: Maybe<MagicSchool>;
  /** Subclasses that can cast this spell. */
  subclasses?: Maybe<Array<Subclass>>;
  /** Timestamp of the last update */
  updated_at: Scalars['String']['output'];
};

/** Represents a choice from a list of Spells. */
export type SpellChoice = {
  __typename?: 'SpellChoice';
  /** The number of Spells to choose from this list. */
  choose: Scalars['Int']['output'];
  /** The set of Spell options available. */
  from: SpellChoiceOptionSet;
  /** The type of choice (e.g., spells). */
  type: Scalars['String']['output'];
};

/** Represents a reference to a Spell within a choice option set. */
export type SpellChoiceOption = {
  __typename?: 'SpellChoiceOption';
  /** The resolved Spell object. */
  item: Spell;
  /** The type of this option (e.g., "reference"). */
  option_type: Scalars['String']['output'];
};

/** Represents a set of Spell options for a choice. */
export type SpellChoiceOptionSet = {
  __typename?: 'SpellChoiceOptionSet';
  /** The type of the option set (e.g., resource_list, options_array). */
  option_set_type: Scalars['String']['output'];
  /** The list of Spell options available. */
  options: Array<SpellChoiceOption>;
};

/** Details about a spell's saving throw */
export type SpellDc = {
  __typename?: 'SpellDC';
  /** The result of a successful save (e.g., 'half', 'none'). */
  dc_success: Scalars['String']['output'];
  /** The ability score used for the saving throw. */
  dc_type: AbilityScore;
  /** Additional description for the saving throw. */
  desc?: Maybe<Scalars['String']['output']>;
};

/** Details about spell damage */
export type SpellDamage = {
  __typename?: 'SpellDamage';
  /** Damage scaling based on character level, transformed from raw data. */
  damage_at_character_level?: Maybe<Array<LevelValue>>;
  damage_at_slot_level: Array<LevelValue>;
  /** Type of damage dealt. */
  damage_type?: Maybe<DamageType>;
};

export type SpellOrder = {
  by: SpellOrderField;
  direction: OrderByDirection;
  then_by?: InputMaybe<SpellOrder>;
};

/** Fields to sort Spells by */
export type SpellOrderField =
  | 'AREA_OF_EFFECT_SIZE'
  | 'LEVEL'
  | 'NAME'
  | 'SCHOOL';

/** Prerequisite based on knowing a specific spell */
export type SpellPrerequisite = {
  __typename?: 'SpellPrerequisite';
  /** The specific spell required. */
  spell: Spell;
  /** Type indicator for this prerequisite. */
  type: Scalars['String']['output'];
};

/** Represents a count of spell slots for a specific level. */
export type SpellSlotCount = {
  __typename?: 'SpellSlotCount';
  /** The number of spell slots available for this level. */
  count: Scalars['Int']['output'];
  /** The spell slot level. */
  slot_level: Scalars['Int']['output'];
};

/** Spellcasting details for a class */
export type Spellcasting = {
  __typename?: 'Spellcasting';
  /** Spellcasting details for the class. */
  info: Array<SpellcastingInfo>;
  /** Level of the spellcasting ability. */
  level: Scalars['Int']['output'];
  /** Ability score used for spellcasting. */
  spellcasting_ability: AbilityScore;
};

/** Information about a class's spellcasting ability */
export type SpellcastingInfo = {
  __typename?: 'SpellcastingInfo';
  /** Description of the spellcasting ability. */
  desc: Array<Scalars['String']['output']>;
  /** Name of the spellcasting ability. */
  name: Scalars['String']['output'];
};

/** Represents a choice for starting equipment. */
export type StartingEquipmentChoice = {
  __typename?: 'StartingEquipmentChoice';
  /** The number of items or options to choose. */
  choose: Scalars['Int']['output'];
  /** A description of the choice presented to the user. */
  desc?: Maybe<Scalars['String']['output']>;
  /** The set of options or category to choose from. */
  from: StartingEquipmentFromUnion;
  /** The type of choice, e.g., 'equipment'. */
  type: Scalars['String']['output'];
};

export type StartingEquipmentFromUnion = EquipmentCategorySet | EquipmentOptionSet;

/** Represents a choice from a list of string options. */
export type StringChoice = {
  __typename?: 'StringChoice';
  /** The number of options to choose from this list. */
  choose: Scalars['Int']['output'];
  /** The set of string options available. */
  from: StringChoiceOptionSet;
  /** The type or category of the choice. */
  type: Scalars['String']['output'];
};

/** Represents a single string option within a choice (e.g., a flaw, a bond). */
export type StringChoiceOption = {
  __typename?: 'StringChoiceOption';
  /** The type of the string option. */
  option_type: Scalars['String']['output'];
  /** The text content of the string option. */
  string: Scalars['String']['output'];
};

/** Represents a set of string options. */
export type StringChoiceOptionSet = {
  __typename?: 'StringChoiceOptionSet';
  /** The type of the string option set. */
  option_set_type: Scalars['String']['output'];
  /** The list of string options available. */
  options: Array<StringChoiceOption>;
};

/** Represents a subclass (e.g., Path of the Berserker, School of Evocation) */
export type Subclass = {
  __typename?: 'Subclass';
  /** The parent class for this subclass. */
  class?: Maybe<Class>;
  /** Description of the subclass */
  desc: Array<Scalars['String']['output']>;
  /** Unique identifier for the subclass */
  index: Scalars['String']['output'];
  /** Name of the subclass */
  name: Scalars['String']['output'];
  /** Spells specific to this subclass. */
  spells?: Maybe<Array<SubclassSpell>>;
  /** Flavor text describing the subclass */
  subclass_flavor: Scalars['String']['output'];
  /** Features and abilities gained by level for this subclass. */
  subclass_levels?: Maybe<Array<Level>>;
  /** Timestamp of the last update */
  updated_at: Scalars['String']['output'];
};

export type SubclassOrder = {
  by: SubclassOrderField;
  direction: OrderByDirection;
  then_by?: InputMaybe<SubclassOrder>;
};

/** Fields to sort Subclasses by */
export type SubclassOrderField =
  | 'NAME';

/** Subclass-specific features and values gained at a level */
export type SubclassSpecific = {
  __typename?: 'SubclassSpecific';
  /** Maximum level of spells gained via Bard's Additional Magical Secrets. */
  additional_magical_secrets_max_lvl?: Maybe<Scalars['Int']['output']>;
  /** Range of subclass-specific auras (e.g., Paladin) in feet. */
  aura_range?: Maybe<Scalars['Int']['output']>;
};

/** Spell gained by a subclass */
export type SubclassSpell = {
  __typename?: 'SubclassSpell';
  /** Resolves the prerequisites to actual Level or Feature objects. */
  prerequisites?: Maybe<Array<SubclassSpellPrerequisite>>;
  /** The spell gained. */
  spell: Spell;
};

export type SubclassSpellPrerequisite = Feature | Level;

/** A subrace representing a specific heritage within a larger race. */
export type Subrace = {
  __typename?: 'Subrace';
  /** Ability score bonuses granted by this subrace. */
  ability_bonuses: Array<SubraceAbilityBonus>;
  /** A description of the subrace. */
  desc: Scalars['String']['output'];
  /** The unique identifier for this subrace (e.g., high-elf). */
  index: Scalars['String']['output'];
  /** The name of the subrace (e.g., High Elf). */
  name: Scalars['String']['output'];
  /** The parent race for this subrace. */
  race?: Maybe<Race>;
  /** Racial traits associated with this subrace. */
  racial_traits?: Maybe<Array<Trait>>;
  /** Timestamp of the last update. */
  updated_at: Scalars['String']['output'];
};

/** Bonus to an ability score provided by a subrace. */
export type SubraceAbilityBonus = {
  __typename?: 'SubraceAbilityBonus';
  /** The ability score receiving the bonus. */
  ability_score?: Maybe<AbilityScore>;
  /** The bonus value to the ability score. */
  bonus: Scalars['Int']['output'];
};

export type SubraceOrder = {
  by: SubraceOrderField;
  direction: OrderByDirection;
  then_by?: InputMaybe<SubraceOrder>;
};

/** Fields to sort Subraces by */
export type SubraceOrderField =
  | 'NAME';

/** Range for a thrown weapon. */
export type ThrowRange = {
  __typename?: 'ThrowRange';
  /** The long range when thrown. */
  long: Scalars['Int']['output'];
  /** The normal range when thrown. */
  normal: Scalars['Int']['output'];
};

/** Represents Tool equipment */
export type Tool = IEquipment & {
  __typename?: 'Tool';
  /** Cost of the equipment in coinage. */
  cost: Cost;
  /** Description of the equipment. */
  desc?: Maybe<Array<Scalars['String']['output']>>;
  /** The category this equipment belongs to. */
  equipment_category: EquipmentCategory;
  /** Category if the equipment is gear. */
  gear_category?: Maybe<EquipmentCategory>;
  /** The unique identifier for this equipment. */
  index: Scalars['String']['output'];
  /** The name of the equipment. */
  name: Scalars['String']['output'];
  properties?: Maybe<Array<WeaponProperty>>;
  /** Category of tool (e.g., Artisan's Tools, Gaming Set). */
  tool_category: Scalars['String']['output'];
  /** Timestamp of the last update. */
  updated_at: Scalars['String']['output'];
  /** Weight of the equipment in pounds. */
  weight?: Maybe<Scalars['Float']['output']>;
};

/** A racial or subracial trait providing specific benefits or abilities. */
export type Trait = {
  __typename?: 'Trait';
  /** A description of the trait. */
  desc: Array<Scalars['String']['output']>;
  /** The unique identifier for this trait (e.g., darkvision). */
  index: Scalars['String']['output'];
  language_options?: Maybe<LanguageChoice>;
  /** The name of the trait (e.g., Darkvision). */
  name: Scalars['String']['output'];
  /** A parent trait, if this is a sub-trait. */
  parent?: Maybe<Trait>;
  /** Proficiencies granted by this trait. */
  proficiencies?: Maybe<Array<Proficiency>>;
  proficiency_choices?: Maybe<ProficiencyChoice>;
  /** Races that possess this trait. */
  races?: Maybe<Array<Race>>;
  /** Subraces that possess this trait. */
  subraces?: Maybe<Array<Subrace>>;
  /** Specific details for this trait, if applicable. */
  trait_specific?: Maybe<TraitSpecific>;
  /** Timestamp of the last update. */
  updated_at: Scalars['String']['output'];
};

/** DC details for a trait action (lacks dc_value). */
export type TraitActionDc = {
  __typename?: 'TraitActionDC';
  /** The ability score associated with this DC. */
  dc_type: AbilityScore;
  /** The result of a successful save against this DC. */
  success_type: Scalars['String']['output'];
};

/** Represents a choice from a list of Traits. */
export type TraitChoice = {
  __typename?: 'TraitChoice';
  /** The number of Traits to choose from this list. */
  choose: Scalars['Int']['output'];
  /** The set of Trait options available. */
  from: TraitChoiceOptionSet;
  /** The type of choice (e.g., subtraits). */
  type: Scalars['String']['output'];
};

/** Represents a reference to a Trait within a choice option set. */
export type TraitChoiceOption = {
  __typename?: 'TraitChoiceOption';
  /** The resolved Trait object. */
  item: Trait;
  /** The type of this option (e.g., "reference"). */
  option_type: Scalars['String']['output'];
};

/** Represents a set of Trait options for a choice. */
export type TraitChoiceOptionSet = {
  __typename?: 'TraitChoiceOptionSet';
  /** The type of the option set (e.g., resource_list, options_array). */
  option_set_type: Scalars['String']['output'];
  /** The list of Trait options available. */
  options: Array<TraitChoiceOption>;
};

export type TraitOrder = {
  by: TraitOrderField;
  direction: OrderByDirection;
  then_by?: InputMaybe<TraitOrder>;
};

/** Fields to sort Traits by */
export type TraitOrderField =
  | 'NAME';

/** Details specific to certain traits. */
export type TraitSpecific = {
  __typename?: 'TraitSpecific';
  /** Breath weapon action details, if applicable. */
  breath_weapon?: Maybe<Action>;
  damage_type?: Maybe<DamageType>;
  spell_options?: Maybe<SpellChoice>;
  subtrait_options?: Maybe<TraitChoice>;
};

/** Usage limit details for an action */
export type Usage = {
  __typename?: 'Usage';
  /** Number of times the action can be used. */
  times: Scalars['Int']['output'];
  /** Type of usage limit (e.g., 'per day'). */
  type: Scalars['String']['output'];
};

/** Represents Vehicle equipment */
export type Vehicle = IEquipment & {
  __typename?: 'Vehicle';
  /** Carrying capacity of the vehicle. */
  capacity?: Maybe<Scalars['String']['output']>;
  /** Cost of the equipment in coinage. */
  cost: Cost;
  /** Description of the equipment. */
  desc?: Maybe<Array<Scalars['String']['output']>>;
  /** The category this equipment belongs to. */
  equipment_category: EquipmentCategory;
  /** Category if the equipment is gear. */
  gear_category?: Maybe<EquipmentCategory>;
  /** The unique identifier for this equipment. */
  index: Scalars['String']['output'];
  /** The name of the equipment. */
  name: Scalars['String']['output'];
  properties?: Maybe<Array<WeaponProperty>>;
  /** Movement speed of the vehicle. */
  speed?: Maybe<Speed>;
  /** Timestamp of the last update. */
  updated_at: Scalars['String']['output'];
  /** Category of vehicle (e.g., Ship, Land). */
  vehicle_category: Scalars['String']['output'];
  /** Weight of the equipment in pounds. */
  weight?: Maybe<Scalars['Float']['output']>;
};

/** Represents Weapon equipment */
export type Weapon = IEquipment & {
  __typename?: 'Weapon';
  /** Range category for weapons (e.g., Melee, Ranged). */
  category_range: Scalars['String']['output'];
  /** Cost of the equipment in coinage. */
  cost: Cost;
  /** Primary damage dealt by the weapon. */
  damage?: Maybe<Damage>;
  /** Description of the equipment. */
  desc?: Maybe<Array<Scalars['String']['output']>>;
  /** The category this equipment belongs to. */
  equipment_category: EquipmentCategory;
  /** Category if the equipment is gear. */
  gear_category?: Maybe<EquipmentCategory>;
  /** The unique identifier for this equipment. */
  index: Scalars['String']['output'];
  /** The name of the equipment. */
  name: Scalars['String']['output'];
  /** Properties of the weapon. */
  properties?: Maybe<Array<WeaponProperty>>;
  /** Weapon range details. */
  range?: Maybe<Range>;
  /** Range when the weapon is thrown. */
  throw_range?: Maybe<ThrowRange>;
  /** Damage dealt when using the weapon with two hands. */
  two_handed_damage?: Maybe<Damage>;
  /** Timestamp of the last update. */
  updated_at: Scalars['String']['output'];
  /** Category of weapon (e.g., Simple, Martial). */
  weapon_category: Scalars['String']['output'];
  /** Range classification of weapon (e.g., Melee, Ranged). */
  weapon_range: Scalars['String']['output'];
  /** Weight of the equipment in pounds. */
  weight?: Maybe<Scalars['Float']['output']>;
};

/** A property that can be applied to a weapon, modifying its use or characteristics. */
export type WeaponProperty = {
  __typename?: 'WeaponProperty';
  /** A description of the weapon property. */
  desc: Array<Scalars['String']['output']>;
  /** The unique identifier for this property (e.g., versatile). */
  index: Scalars['String']['output'];
  /** The name of the property (e.g., Versatile). */
  name: Scalars['String']['output'];
  /** Timestamp of the last update. */
  updated_at: Scalars['String']['output'];
};

export type WeaponPropertyOrder = {
  by: WeaponPropertyOrderField;
  direction: OrderByDirection;
  then_by?: InputMaybe<WeaponPropertyOrder>;
};

/** Fields to sort Weapon Properties by */
export type WeaponPropertyOrderField =
  | 'NAME';

export type SearchEquipmentQueryVariables = Exact<{
  name: Scalars['String']['input'];
}>;


export type SearchEquipmentQuery = { __typename?: 'Query', equipments: Array<
    | { __typename?: 'Ammunition', index: string, name: string }
    | { __typename?: 'Armor', index: string, name: string }
    | { __typename?: 'Gear', index: string, name: string }
    | { __typename?: 'Pack', index: string, name: string }
    | { __typename?: 'Tool', index: string, name: string }
    | { __typename?: 'Vehicle', index: string, name: string }
    | { __typename?: 'Weapon', index: string, name: string }
  > };


export const SearchEquipmentDocument = gql`
    query SearchEquipment($name: String!) {
  equipments(name: $name) {
    ... on IEquipment {
      index
      name
    }
  }
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string, variables?: any) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType, _variables) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    SearchEquipment(variables: SearchEquipmentQueryVariables, requestHeaders?: GraphQLClientRequestHeaders, signal?: RequestInit['signal']): Promise<SearchEquipmentQuery> {
      return withWrapper((wrappedRequestHeaders) => client.request<SearchEquipmentQuery>({ document: SearchEquipmentDocument, variables, requestHeaders: { ...requestHeaders, ...wrappedRequestHeaders }, signal }), 'SearchEquipment', 'query', variables);
    }
  };
}
export type Sdk = ReturnType<typeof getSdk>;