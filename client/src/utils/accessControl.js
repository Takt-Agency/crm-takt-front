const FUNCTIONALITY_DEFINITIONS = [
  { key: "dashboard.view", label: "Voir le tableau de bord", group: "dashboard" },
  { key: "clients.view", label: "Voir les clients", group: "clients" },
  { key: "clients.create", label: "Creer les clients", group: "clients" },
  { key: "clients.update", label: "Modifier les clients", group: "clients" },
  { key: "clients.delete", label: "Supprimer les clients", group: "clients" },
  { key: "clients.export", label: "Exporter les clients", group: "clients" },
  { key: "prospects.view", label: "Voir les prospects", group: "prospects" },
  { key: "prospects.create", label: "Creer les prospects", group: "prospects" },
  { key: "prospects.update", label: "Modifier les prospects", group: "prospects" },
  { key: "prospects.delete", label: "Supprimer les prospects", group: "prospects" },
  { key: "tasks.view", label: "Voir les taches", group: "tasks" },
  { key: "tasks.create", label: "Creer les taches", group: "tasks" },
  { key: "tasks.update", label: "Modifier les taches", group: "tasks" },
  { key: "tasks.delete", label: "Supprimer les taches", group: "tasks" },
  { key: "tasks.assign", label: "Affecter les taches", group: "tasks" },
  { key: "tasks.status", label: "Changer le statut des taches", group: "tasks" },
  { key: "invoices.view", label: "Voir les devis et factures", group: "invoices" },
  { key: "invoices.create", label: "Creer les devis et factures", group: "invoices" },
  { key: "invoices.update", label: "Modifier les devis et factures", group: "invoices" },
  { key: "invoices.delete", label: "Supprimer les devis et factures", group: "invoices" },
  { key: "invoices.send", label: "Envoyer les devis", group: "invoices" },
  { key: "invoices.pdf", label: "Generer les PDF", group: "invoices" },
  { key: "finances.view", label: "Voir les finances", group: "finances" },
  { key: "finances.reconcile", label: "Rapprochement bancaire", group: "finances" },
  { key: "finances.import", label: "Importer les releves", group: "finances" },
  { key: "finances.decaissements", label: "Gerer les decaissements", group: "finances" },
  { key: "hr.view", label: "Voir RH", group: "hr" },
  { key: "hr.create", label: "Creer les employes", group: "hr" },
  { key: "hr.update", label: "Modifier les employes", group: "hr" },
  { key: "hr.delete", label: "Supprimer les employes", group: "hr" },
  { key: "hr.leaves", label: "Gerer les conges", group: "hr" },
  { key: "hr.attendance", label: "Gerer la presence", group: "hr" },
  { key: "users.view", label: "Voir les utilisateurs", group: "users" },
  { key: "users.create", label: "Creer les utilisateurs", group: "users" },
  { key: "users.update", label: "Modifier les utilisateurs", group: "users" },
  { key: "users.delete", label: "Supprimer les utilisateurs", group: "users" },
  { key: "users.permissions", label: "Gerer les permissions", group: "users" },
  { key: "payroll.view", label: "Voir la paie", group: "payroll" },
  { key: "payroll.create", label: "Generer la paie", group: "payroll" },
  { key: "payroll.update", label: "Modifier la paie", group: "payroll" },
  { key: "payroll.approve", label: "Approuver la paie", group: "payroll" },
  { key: "payroll.pay", label: "Marquer paie payee", group: "payroll" },
  { key: "payroll.export", label: "Exporter la paie", group: "payroll" },
  { key: "payroll.rules", label: "Gerer les regles de paie", group: "payroll" },
];

const MODULE_PERMISSIONS = FUNCTIONALITY_DEFINITIONS.map((definition) => definition.key);

const ROLE_DEFAULT_PERMISSIONS = {
  super_admin: [...MODULE_PERMISSIONS],
  administrateur: [
    "dashboard.view",
    "clients.view",
    "clients.create",
    "clients.update",
    "clients.delete",
    "clients.export",
    "prospects.view",
    "prospects.create",
    "prospects.update",
    "prospects.delete",
    "tasks.view",
    "tasks.create",
    "tasks.update",
    "tasks.delete",
    "tasks.assign",
    "tasks.status",
    "invoices.view",
    "invoices.create",
    "invoices.update",
    "invoices.delete",
    "invoices.send",
    "invoices.pdf",
    "finances.view",
    "finances.reconcile",
    "finances.import",
    "finances.decaissements",
    "hr.view",
    "hr.create",
    "hr.update",
    "hr.delete",
    "hr.leaves",
    "hr.attendance",
    "payroll.view",
    "payroll.create",
    "payroll.update",
    "payroll.approve",
    "payroll.pay",
    "payroll.export",
    "payroll.rules",
  ],
  manager: [
    "dashboard.view",
    "clients.view",
    "clients.create",
    "clients.update",
    "clients.export",
    "prospects.view",
    "prospects.create",
    "prospects.update",
    "tasks.view",
    "tasks.create",
    "tasks.update",
    "tasks.assign",
    "tasks.status",
    "invoices.view",
    "invoices.create",
    "invoices.update",
    "invoices.send",
    "invoices.pdf",
    "finances.view",
    "finances.reconcile",
    "hr.view",
    "hr.leaves",
    "hr.attendance",
    "payroll.view",
    "payroll.create",
    "payroll.update",
  ],
  commercial: [
    "dashboard.view",
    "clients.view",
    "clients.create",
    "clients.update",
    "clients.export",
    "prospects.view",
    "prospects.create",
    "prospects.update",
    "tasks.view",
    "tasks.create",
    "tasks.update",
    "invoices.view",
    "invoices.create",
    "invoices.update",
    "invoices.send",
    "invoices.pdf",
  ],
  comptable: [
    "dashboard.view",
    "clients.view",
    "clients.export",
    "prospects.view",
    "tasks.view",
    "invoices.view",
    "invoices.create",
    "invoices.update",
    "invoices.send",
    "invoices.pdf",
    "finances.view",
    "finances.reconcile",
    "finances.import",
    "finances.decaissements",
    "payroll.view",
    "payroll.pay",
    "payroll.export",
  ],
  employe: ["dashboard.view", "tasks.view", "tasks.status", "hr.view", "hr.leaves", "hr.attendance"],
};

const DEFAULT_PERMISSION_MODE = "role";

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const normalizePermission = (permission) => String(permission || "").trim().toLowerCase();

const sanitizePermissions = (permissions = []) => {
  if (!Array.isArray(permissions)) {
    return [];
  }

  return [...new Set(permissions.map(normalizePermission).filter((permission) => MODULE_PERMISSIONS.includes(permission)))];
};

const getDefaultPermissionsForRole = (role) => ROLE_DEFAULT_PERMISSIONS[normalizeRole(role)] || [];

const matchesPermissionGroup = (permission, group) =>
  permission === group || permission.startsWith(`${group}.`);

const getEffectivePermissions = (user) => {
  if (!user) {
    return [];
  }

  const permissionMode = String(user.permissionMode || DEFAULT_PERMISSION_MODE)
    .trim()
    .toLowerCase();
  const explicitPermissions = sanitizePermissions(user.permissions || []);
  if (permissionMode === "custom") {
    return explicitPermissions;
  }

  return getDefaultPermissionsForRole(user.role);
};

const canAccessModule = (user, moduleName) => {
  if (!user) {
    return false;
  }

  if (normalizeRole(user.role) === "super_admin") {
    return true;
  }

  const normalizedModule = normalizePermission(moduleName);
  return getEffectivePermissions(user).some((permission) =>
    matchesPermissionGroup(normalizePermission(permission), normalizedModule),
  );
};

module.exports = {
  MODULE_PERMISSIONS,
  FUNCTIONALITY_DEFINITIONS,
  ROLE_DEFAULT_PERMISSIONS,
  DEFAULT_PERMISSION_MODE,
  canAccessModule,
  getDefaultPermissionsForRole,
  getEffectivePermissions,
  normalizePermission,
  normalizeRole,
  sanitizePermissions,
};