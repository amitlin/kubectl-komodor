// Resource type mapping: canonical name, Komodor display, aliases, urlPath, category, and global flag
export const RESOURCE_TYPES = [
  // Workloads
  {
    canonical: "Pod",
    komodor: "Pods",
    aliases: ["pod", "pods"],
    urlPath: "pods",
    category: "workloads",
  },
  {
    canonical: "ReplicaSet",
    komodor: "ReplicaSets",
    aliases: ["rs", "replicaset", "replicasets"],
    urlPath: "replicasets",
    category: "workloads",
  },
  {
    canonical: "Deployment",
    komodor: "Deployments",
    aliases: ["deploy", "deployment", "deployments"],
    urlPath: "deployments",
    category: "workloads",
  },
  {
    canonical: "Job",
    komodor: "Jobs",
    aliases: ["job", "jobs"],
    urlPath: "jobs",
    category: "workloads",
  },
  {
    canonical: "CronJob",
    komodor: "CronJobs",
    aliases: ["cronjob", "cronjobs"],
    urlPath: "cronjobs",
    category: "workloads",
  },
  {
    canonical: "StatefulSet",
    komodor: "StatefulSets",
    aliases: ["sts", "statefulset", "statefulsets"],
    urlPath: "statefulsets",
    category: "workloads",
  },
  {
    canonical: "DaemonSet",
    komodor: "DaemonSets",
    aliases: ["ds", "daemonset", "daemonsets"],
    urlPath: "daemonset",
    category: "workloads",
  },
  {
    canonical: "Argo Rollout",
    komodor: "Argo Rollouts",
    aliases: ["argo", "rollout", "argo rollout", "argo rollouts"],
    urlPath: "argo rollouts",
    category: "workloads",
  },
  // Storage
  {
    canonical: "PersistentVolumeClaim",
    komodor: "PVCs",
    aliases: ["pvc", "pvcs", "persistentvolumeclaim", "persistentvolumeclaims"],
    urlPath: "pvcs",
    category: "storage",
  },
  {
    canonical: "PersistentVolume",
    komodor: "PVs",
    aliases: ["pv", "pvs", "persistentvolume", "persistentvolumes"],
    urlPath: "pvs",
    category: "storage",
  },
  {
    canonical: "StorageClass",
    komodor: "Storage Classes",
    aliases: ["sc", "storageclass", "storageclasses"],
    urlPath: "storage-classes",
    category: "storage",
    global: true,
  },
  // Configuration
  {
    canonical: "ConfigMap",
    komodor: "ConfigMaps",
    aliases: ["cm", "configmap", "configmaps"],
    urlPath: "configmaps",
    category: "configuration",
  },
  {
    canonical: "Secret",
    komodor: "Secrets",
    aliases: ["secret", "secrets"],
    urlPath: "secrets",
    category: "configuration",
  },
  {
    canonical: "ResourceQuota",
    komodor: "Resource Quotas",
    aliases: ["rq", "resourcequota", "resourcequotas"],
    urlPath: "resourcequotas",
    category: "configuration",
  },
  {
    canonical: "LimitRange",
    komodor: "Limit Ranges",
    aliases: ["limitrange", "limitranges"],
    urlPath: "limitranges",
    category: "configuration",
  },
  {
    canonical: "HorizontalPodAutoscaler",
    komodor: "HPAs",
    aliases: [
      "hpa",
      "hpas",
      "horizontalpodautoscaler",
      "horizontalpodautoscalers",
    ],
    urlPath: "hpas",
    category: "configuration",
  },
  {
    canonical: "PodDisruptionBudget",
    komodor: "PDBs",
    aliases: ["pdb", "pdbs", "poddisruptionbudget", "poddisruptionbudgets"],
    urlPath: "pdbs",
    category: "configuration",
  },
  // Network
  {
    canonical: "Service",
    komodor: "Kubernetes Services",
    aliases: ["svc", "service", "services"],
    urlPath: "services",
    category: "network",
  },
  {
    canonical: "Endpoints",
    komodor: "Endpoints",
    aliases: ["endpoint", "endpoints"],
    urlPath: "endpoints",
    category: "network",
  },
  {
    canonical: "Ingress",
    komodor: "Ingresses",
    aliases: ["ing", "ingress", "ingresses"],
    urlPath: "ingresses",
    category: "network",
  },
  {
    canonical: "NetworkPolicy",
    komodor: "Network Policies",
    aliases: ["netpol", "networkpolicy", "networkpolicies"],
    urlPath: "networkpolicies",
    category: "network",
  },
  {
    canonical: "EndpointSlice",
    komodor: "Endpoint Slices",
    aliases: ["endpointslice", "endpointslices"],
    urlPath: "endpointslices",
    category: "network",
  },
  // Access Control
  {
    canonical: "ServiceAccount",
    komodor: "Service Accounts",
    aliases: ["sa", "serviceaccount", "serviceaccounts"],
    urlPath: "service-accounts",
    category: "access-control",
  },
  {
    canonical: "ClusterRole",
    komodor: "Cluster Roles",
    aliases: ["clusterrole", "clusterroles"],
    urlPath: "cluster-roles",
    category: "access-control",
    global: true,
  },
  {
    canonical: "Role",
    komodor: "Roles",
    aliases: ["role", "roles"],
    urlPath: "roles",
    category: "access-control",
  },
  {
    canonical: "ClusterRoleBinding",
    komodor: "Cluster Role Bindings",
    aliases: ["clusterrolebinding", "clusterrolebindings"],
    urlPath: "cluster-role-bindings",
    category: "access-control",
    global: true,
  },
  {
    canonical: "RoleBinding",
    komodor: "Role Bindings",
    aliases: ["rolebinding", "rolebindings"],
    urlPath: "role-bindings",
    category: "access-control",
  },
];

export function resolveResourceType(input: string) {
  const normalized = input.toLowerCase();
  for (const type of RESOURCE_TYPES) {
    if (type.aliases.includes(normalized)) {
      return type;
    }
  }
  return null;
}
