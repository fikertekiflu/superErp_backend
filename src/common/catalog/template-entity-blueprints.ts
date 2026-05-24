import { CreateEntityDto } from '../../modules/entities/dto/create-entity.dto';

export interface TemplateEntityBlueprint {
  /** Canonical slug stored in the database */
  slug: string;
  /** Alternate slugs templates may reference (not created separately) */
  aliases: string[];
  definition: CreateEntityDto;
}

const field = (
  name: string,
  label: string,
  type: string,
  order: number,
  extra?: Partial<CreateEntityDto['fields'][0]>,
): CreateEntityDto['fields'][0] => ({
  name,
  label,
  type,
  required: extra?.required ?? false,
  unique: extra?.unique ?? false,
  options: extra?.options,
  defaultValue: extra?.defaultValue,
  display: {
    order,
    showInList: true,
    showInForm: true,
  },
});

export const TEMPLATE_ENTITY_BLUEPRINTS: TemplateEntityBlueprint[] = [
  {
    slug: 'employees',
    aliases: ['employee'],
    definition: {
      name: 'Employees',
      slug: 'employees',
      pluralName: 'Employees',
      description: 'Staff records for HR and onboarding workflows',
      icon: 'Users',
      isInMenu: true,
      menuOrder: 5,
      fields: [
        field('first_name', 'First Name', 'string', 1, { required: true }),
        field('last_name', 'Last Name', 'string', 2, { required: true }),
        field('email', 'Work Email', 'email', 3, { required: true, unique: true }),
        field('department', 'Department', 'string', 4),
        field('job_title', 'Job Title', 'string', 5),
        field(
          'status',
          'Status',
          'select',
          6,
          {
            required: true,
            options: ['Onboarding', 'Active', 'On Leave', 'Terminated'],
            defaultValue: 'Onboarding',
          },
        ),
        field('start_date', 'Start Date', 'date', 7),
      ],
    },
  },
  {
    slug: 'expenses',
    aliases: ['expense'],
    definition: {
      name: 'Expenses',
      slug: 'expenses',
      pluralName: 'Expenses',
      description: 'Expense reports and reimbursements',
      icon: 'Receipt',
      isInMenu: true,
      menuOrder: 6,
      fields: [
        field('title', 'Title', 'string', 1, { required: true }),
        field('amount', 'Amount', 'number', 2, { required: true }),
        field('category', 'Category', 'string', 3),
        field(
          'status',
          'Status',
          'select',
          4,
          {
            required: true,
            options: ['Draft', 'Submitted', 'Approved', 'Rejected', 'Paid'],
            defaultValue: 'Draft',
          },
        ),
        field('submitted_by', 'Submitted By', 'string', 5),
      ],
    },
  },
  {
    slug: 'products',
    aliases: ['product'],
    definition: {
      name: 'Products',
      slug: 'products',
      pluralName: 'Products',
      description: 'Product catalog for procurement workflows',
      icon: 'Package',
      isInMenu: true,
      menuOrder: 7,
      fields: [
        field('name', 'Product Name', 'string', 1, { required: true }),
        field('sku', 'SKU', 'string', 2, { unique: true }),
        field('unit_price', 'Unit Price', 'number', 3),
        field('stock', 'Stock', 'number', 4, { defaultValue: 0 }),
      ],
    },
  },
  {
    slug: 'suppliers',
    aliases: ['supplier'],
    definition: {
      name: 'Suppliers',
      slug: 'suppliers',
      pluralName: 'Suppliers',
      description: 'Vendors and suppliers',
      icon: 'Truck',
      isInMenu: true,
      menuOrder: 8,
      fields: [
        field('name', 'Supplier Name', 'string', 1, { required: true }),
        field('contact_email', 'Contact Email', 'email', 2),
        field('phone', 'Phone', 'string', 3),
      ],
    },
  },
  {
    slug: 'leads',
    aliases: ['lead'],
    definition: {
      name: 'Leads',
      slug: 'leads',
      pluralName: 'Leads',
      description: 'Sales leads and prospects',
      icon: 'UserPlus',
      isInMenu: true,
      menuOrder: 10,
      fields: [
        field('name', 'Contact Name', 'string', 1, { required: true }),
        field('email', 'Email', 'email', 2),
        field('company', 'Company', 'string', 3),
        field('status', 'Status', 'select', 4, { options: ['New', 'Contacted', 'Qualified', 'Lost'], defaultValue: 'New' }),
        field('source', 'Source', 'string', 5),
      ],
    },
  },
  {
    slug: 'deals',
    aliases: ['deal'],
    definition: {
      name: 'Deals',
      slug: 'deals',
      pluralName: 'Deals',
      description: 'Sales opportunities',
      icon: 'Briefcase',
      isInMenu: true,
      menuOrder: 11,
      fields: [
        field('title', 'Deal Title', 'string', 1, { required: true }),
        field('amount', 'Amount', 'number', 2),
        field('stage', 'Stage', 'select', 3, { options: ['Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost'] }),
      ],
    },
  },
  {
    slug: 'clients',
    aliases: ['client', 'customers', 'customer'],
    definition: {
      name: 'Clients',
      slug: 'clients',
      pluralName: 'Clients',
      description: 'Customer accounts',
      icon: 'Building2',
      isInMenu: true,
      menuOrder: 12,
      fields: [
        field('company', 'Company', 'string', 1, { required: true }),
        field('email', 'Email', 'email', 2),
        field('phone', 'Phone', 'string', 3),
      ],
    },
  },
  {
    slug: 'orders',
    aliases: ['order'],
    definition: {
      name: 'Orders',
      slug: 'orders',
      pluralName: 'Orders',
      description: 'Sales and service orders',
      icon: 'ShoppingCart',
      isInMenu: true,
      menuOrder: 13,
      fields: [
        field('order_number', 'Order #', 'string', 1, { required: true, unique: true }),
        field('total', 'Total', 'number', 2),
        field('status', 'Status', 'select', 3, { options: ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] }),
      ],
    },
  },
  {
    slug: 'patients',
    aliases: ['patient'],
    definition: {
      name: 'Patients',
      slug: 'patients',
      pluralName: 'Patients',
      description: 'Patient records',
      icon: 'Heart',
      isInMenu: true,
      menuOrder: 14,
      fields: [
        field('full_name', 'Full Name', 'string', 1, { required: true }),
        field('date_of_birth', 'Date of Birth', 'date', 2),
        field('phone', 'Phone', 'string', 3),
        field('insurance_id', 'Insurance ID', 'string', 4),
      ],
    },
  },
  {
    slug: 'appointments',
    aliases: ['appointment'],
    definition: {
      name: 'Appointments',
      slug: 'appointments',
      pluralName: 'Appointments',
      description: 'Scheduled visits',
      icon: 'Calendar',
      isInMenu: true,
      menuOrder: 15,
      fields: [
        field('patient_name', 'Patient', 'string', 1, { required: true }),
        field('scheduled_at', 'Date & Time', 'date', 2, { required: true }),
        field('provider', 'Clinician', 'string', 3),
        field('status', 'Status', 'select', 4, { options: ['Requested', 'Confirmed', 'Completed', 'Cancelled'] }),
      ],
    },
  },
  {
    slug: 'projects',
    aliases: ['project'],
    definition: {
      name: 'Projects',
      slug: 'projects',
      pluralName: 'Projects',
      description: 'Client projects',
      icon: 'FolderKanban',
      isInMenu: true,
      menuOrder: 16,
      fields: [
        field('name', 'Project Name', 'string', 1, { required: true }),
        field('client', 'Client', 'string', 2),
        field('status', 'Status', 'select', 3, { options: ['Planning', 'Active', 'On Hold', 'Completed'] }),
      ],
    },
  },
  {
    slug: 'support_tickets',
    aliases: ['support_ticket', 'tickets', 'ticket'],
    definition: {
      name: 'Support Tickets',
      slug: 'support_tickets',
      pluralName: 'Support Tickets',
      description: 'Customer and IT support',
      icon: 'LifeBuoy',
      isInMenu: true,
      menuOrder: 17,
      fields: [
        field('subject', 'Subject', 'string', 1, { required: true }),
        field('priority', 'Priority', 'select', 2, { options: ['Low', 'Medium', 'High', 'Urgent'] }),
        field('status', 'Status', 'select', 3, { options: ['Open', 'In Progress', 'Resolved', 'Closed'] }),
      ],
    },
  },
  {
    slug: 'invoices',
    aliases: ['invoice'],
    definition: {
      name: 'Invoices',
      slug: 'invoices',
      pluralName: 'Invoices',
      description: 'Billing invoices',
      icon: 'FileText',
      isInMenu: true,
      menuOrder: 18,
      fields: [
        field('invoice_number', 'Invoice #', 'string', 1, { required: true }),
        field('amount', 'Amount', 'number', 2, { required: true }),
        field('status', 'Status', 'select', 3, { options: ['Draft', 'Sent', 'Paid', 'Overdue'] }),
      ],
    },
  },
  {
    slug: 'incidents',
    aliases: ['incident'],
    definition: {
      name: 'Incidents',
      slug: 'incidents',
      pluralName: 'Incidents',
      description: 'Safety and clinical incidents',
      icon: 'AlertTriangle',
      isInMenu: true,
      menuOrder: 19,
      fields: [
        field('title', 'Title', 'string', 1, { required: true }),
        field('severity', 'Severity', 'select', 2, { options: ['Low', 'Medium', 'High'] }),
        field('status', 'Status', 'select', 3, { options: ['Reported', 'Investigation', 'Closed'] }),
      ],
    },
  },
  {
    slug: 'quality_inspections',
    aliases: ['quality_inspection'],
    definition: {
      name: 'Quality Inspections',
      slug: 'quality_inspections',
      pluralName: 'Quality Inspections',
      description: 'QC batch records',
      icon: 'ClipboardCheck',
      isInMenu: true,
      menuOrder: 20,
      fields: [
        field('batch_id', 'Batch ID', 'string', 1, { required: true }),
        field('result', 'Result', 'select', 2, { options: ['Pending', 'Pass', 'Fail'] }),
      ],
    },
  },
  {
    slug: 'work_orders',
    aliases: ['work_order'],
    definition: {
      name: 'Work Orders',
      slug: 'work_orders',
      pluralName: 'Work Orders',
      description: 'Maintenance jobs',
      icon: 'Wrench',
      isInMenu: true,
      menuOrder: 21,
      fields: [
        field('title', 'Title', 'string', 1, { required: true }),
        field('equipment', 'Equipment', 'string', 2),
        field('status', 'Status', 'select', 3, { options: ['Reported', 'Assigned', 'In Repair', 'Closed'] }),
      ],
    },
  },
  {
    slug: 'equipment',
    aliases: [],
    definition: {
      name: 'Equipment',
      slug: 'equipment',
      pluralName: 'Equipment',
      description: 'Machines and assets',
      icon: 'Cog',
      isInMenu: true,
      menuOrder: 22,
      fields: [
        field('name', 'Name', 'string', 1, { required: true }),
        field('serial_number', 'Serial #', 'string', 2),
      ],
    },
  },
  {
    slug: 'production_orders',
    aliases: ['production_order'],
    definition: {
      name: 'Production Orders',
      slug: 'production_orders',
      pluralName: 'Production Orders',
      description: 'Manufacturing runs',
      icon: 'Factory',
      isInMenu: true,
      menuOrder: 23,
      fields: [
        field('order_number', 'Order #', 'string', 1, { required: true }),
        field('quantity', 'Quantity', 'number', 2),
        field('status', 'Status', 'select', 3, { options: ['Planned', 'In Production', 'QC Hold', 'Released'] }),
      ],
    },
  },
  {
    slug: 'lab_orders',
    aliases: ['lab_order'],
    definition: {
      name: 'Lab Orders',
      slug: 'lab_orders',
      pluralName: 'Lab Orders',
      description: 'Laboratory tests',
      icon: 'FlaskConical',
      isInMenu: true,
      menuOrder: 24,
      fields: [
        field('test_name', 'Test', 'string', 1, { required: true }),
        field('patient', 'Patient', 'string', 2),
        field('status', 'Status', 'select', 3, { options: ['Ordered', 'Processing', 'Complete'] }),
      ],
    },
  },
  {
    slug: 'timesheets',
    aliases: ['timesheet'],
    definition: {
      name: 'Timesheets',
      slug: 'timesheets',
      pluralName: 'Timesheets',
      description: 'Time tracking',
      icon: 'Clock',
      isInMenu: true,
      menuOrder: 25,
      fields: [
        field('employee', 'Employee', 'string', 1),
        field('hours', 'Hours', 'number', 2, { required: true }),
        field('week_ending', 'Week Ending', 'date', 3),
      ],
    },
  },
  {
    slug: 'contracts',
    aliases: ['contract'],
    definition: {
      name: 'Contracts',
      slug: 'contracts',
      pluralName: 'Contracts',
      description: 'Legal agreements',
      icon: 'FileSignature',
      isInMenu: true,
      menuOrder: 26,
      fields: [
        field('title', 'Title', 'string', 1, { required: true }),
        field('client', 'Client', 'string', 2),
        field('status', 'Status', 'select', 3, { options: ['Draft', 'Legal Review', 'Signed'] }),
      ],
    },
  },
];

export function findBlueprintForSlug(
  slug: string,
): TemplateEntityBlueprint | undefined {
  const normalized = slug.trim().toLowerCase();
  return TEMPLATE_ENTITY_BLUEPRINTS.find(
    (bp) =>
      bp.slug === normalized ||
      bp.aliases.some((a) => a.toLowerCase() === normalized),
  );
}
