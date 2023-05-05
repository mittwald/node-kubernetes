import { INamespacedResourceClient, IResourceClient } from "../resource";
import * as rbacv1b1 from "../types/rbac/v1beta1";
import * as rbacv1 from "../types/rbac/v1";

export interface RBACAPI {
    v1(): RBACV1API;
    v1beta1(): RBACV1beta1API;
}

export interface RBACV1beta1API {
    roles(): INamespacedResourceClient<rbacv1b1.Role, "Role", "rbac.authorization.k8s.io/v1beta1">;
    roleBindings(): INamespacedResourceClient<rbacv1b1.RoleBinding, "RoleBinding", "rbac.authorization.k8s.io/v1beta1">;
}

export interface RBACV1API {
    clusterRoles(): IResourceClient<rbacv1.ClusterRole, "ClusterRole", "rbac.authorization.k8s.io/v1">;
    clusterRoleBindings(): IResourceClient<
        rbacv1.ClusterRoleBinding,
        "ClusterRoleBinding",
        "rbac.authorization.k8s.io/v1"
    >;
    roles(): INamespacedResourceClient<rbacv1.Role, "Role", "rbac.authorization.k8s.io/v1">;
    roleBindings(): INamespacedResourceClient<rbacv1.RoleBinding, "RoleBinding", "rbac.authorization.k8s.io/v1">;
}
