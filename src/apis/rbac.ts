import {INamespacedResourceClient} from "../resource";
import * as rbacv1b1 from "../types/rbac/v1beta1";

export interface RBACAPI {
    v1beta1(): RBACV1beta1API;
}

export interface RBACV1beta1API {
    roles(): INamespacedResourceClient<rbacv1b1.Role, "Role", "rbac.authorization.k8s.io/v1beta1">;
    roleBindings(): INamespacedResourceClient<rbacv1b1.RoleBinding, "RoleBinding", "rbac.authorization.k8s.io/v1beta1">;
}
