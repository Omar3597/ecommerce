import AppError from "../../common/utils/appError";

export type Role = "USER" | "ADMIN" | "MANAGER";

export type Actor = {
  id: string;
  role: Role;
};

export type ReviewResource = {
  id: string;
  userId: string;
};

const hasAnyRole = (actor: Actor, roles: Role[]) =>
  roles.some((r) => actor.role.includes(r));

const isOwner = (actor: Actor, review: ReviewResource) =>
  actor.id === review.userId;

export class ReviewPolicy {
  static assertCanUpdate(actor: Actor, review: ReviewResource) {
    if (!this.canUpdate(actor, review)) {
      throw new AppError(403, "You are not allowed to update this review");
    }
  }

  static assertCanDelete(actor: Actor, review: ReviewResource) {
    if (!this.canDelete(actor, review)) {
      throw new AppError(403, "You are not allowed to delete this review");
    }
  }

  private static canUpdate(actor: Actor, review: ReviewResource): boolean {
    if (!isOwner(actor, review)) return false;

    return true;
  }

  private static canDelete(actor: Actor, review: ReviewResource): boolean {
    if (hasAnyRole(actor, ["ADMIN", "MANAGER"])) return true;

    if (!isOwner(actor, review)) return false;

    return true;
  }
}
