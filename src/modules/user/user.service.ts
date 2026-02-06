import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma";
import AppError from "../../common/utils/appError";
import { updateProfileInput, updatePasswordInput } from "./user.validator";
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

  async updatePassword(user: User, data: updatePasswordInput) {
    const { currentPassword, newPassword } = data;

    const validCurrentPassword = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!validCurrentPassword) {
      throw new AppError(401, "Invalid current password");
    }

    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      throw new AppError(400, "New password must be different");
    }

    return prisma.user.update({
      where: { id: user.id },
      data: {
        password: newPassword,
      },
    });
  }
}
