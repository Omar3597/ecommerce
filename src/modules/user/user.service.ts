import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma";
import AppError from "../../common/utils/appError";
import { updateProfileInput } from "./user.validator";
import { User } from "../../../generated/prisma/client";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
};

export class UserService {
  async updateProfile(user: User, data: updateProfileInput) {
    if (data.name === user.name) {
      throw new AppError(400, "Name is already up to date");
    }

    return prisma.user.update({
      where: { id: user.id },
      data: { name: data.name },
      select: userSelect,
    });
  }
}
