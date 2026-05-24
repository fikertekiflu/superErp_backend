import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('published_workflow_templates')
export class PublishedWorkflowTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  catalogKey: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  category: string;

  @Column({ type: 'jsonb' })
  definition: Record<string, unknown>;

  @Column({ type: 'jsonb', default: [] })
  industryTags: string[];

  @Column({ type: 'jsonb', default: [] })
  blueprintTags: string[];

  @Column({ default: false })
  isPublished: boolean;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
