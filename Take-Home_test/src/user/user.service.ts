import {
  ConflictException,
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/auth/schema/user.schema';
import { InjectQueue } from '@nestjs/bull';
import { DELETE_USER_QUEUE } from './constants/queue.constant';
import { Queue } from 'bull';

@Injectable()
export class UserService {
  constructor(
    @InjectModel('User')
    private readonly userModel: Model<User>,
    @InjectQueue(DELETE_USER_QUEUE)
    private readonly deleteUserQueue: Queue,
  ) {}

  /**
   * Updates a user's information in the database.
   *
   * @param {string} userId - The ID of the user to update.
   * @param {UpdateUserDto} updateUserDto - The data transfer object containing the updated user information.
   * @return {Promise<{statusCode: number, message: string, data: User}>} - A promise that resolves to an object containing the status code, message, and updated user data.
   * @throws {NotFoundException} - If the user with the given ID is not found.
   * @throws {ConflictException} - If the email provided is already in use by another user.
   */
  async update(userId: string, updateUserDto: UpdateUserDto) {
    const { email } = updateUserDto;

    const user = await this.userModel.findById(userId);

    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

    if (email && email !== user.email) {
      const existingUserWithEmail = await this.userModel.findOne({ email });

      if (existingUserWithEmail)
        throw new ConflictException(`Email ${email} is already in use`);

      user.email = email;
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      updateUserDto,
      { new: true },
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'User updated successfully',
      data: updatedUser,
    };
  }

  /**
   * Removes a user by ID and adds a job to the delete user queue.
   *
   * @param {string} id - The ID of the user to remove.
   * @return {Promise<{statusCode: number, message: string}>} - A promise that resolves to an object containing the status code and message.
   * @throws {UnauthorizedException} - If the user is not authorized to delete.
   */
  async remove(id: string) {
    const user = await this.userModel.findById(id);

    if (!user)
      throw new UnauthorizedException('You are not authorized to delete');

    this.deleteUserQueue.add('deleteUser', {
      userId: id,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'User data processed successfully, account deleted',
    };
  }
}
