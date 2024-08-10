// user_queue.controller.ts
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { UserService } from '../user.service';
import { DELETE_USER_QUEUE } from '../constants/queue.constant';
import { Logger } from '@nestjs/common';

@Processor(DELETE_USER_QUEUE)
export class UserDeletionProcessor {
  private readonly logger = new Logger(UserDeletionProcessor.name);
  constructor(private readonly userService: UserService) {}

  @Process('deleteUser')
  /**
   * Handles the deletion of a user asynchronously.
   *
   * @param {Job<any>} job - The job containing the user ID to be deleted.
   * @return {Promise<void>} A promise that resolves when the user is successfully deleted.
   */
  async handleDeleteUser(job: Job<any>) {
    try {
      const { userId } = job.data;

      await this.userService.remove(userId);

      this.logger.log(`User with ID ${userId} has been deleted`);

      await job.moveToCompleted('done', true);
    } catch (error) {
      this.logger.error(`Failed to delete user: ${error.message}`);
      await job.moveToFailed({ message: 'Failed to delete user' }, true);
    }
  }
}
