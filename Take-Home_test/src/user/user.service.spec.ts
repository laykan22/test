import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../auth/schema/user.schema';
import { BullModule, getQueueToken } from '@nestjs/bull';
import { Queue } from 'bull';
import { UnauthorizedException, HttpStatus, NotFoundException, ConflictException } from '@nestjs/common';

interface MockQueue {
  add: jest.Mock;
}

describe('UserService', () => {
  let service: UserService;
  let mockUserModel: Partial<Model<User>>;
  let mockQueue: MockQueue;

  beforeEach(async () => {
    mockUserModel = {
      findById: jest.fn(),
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    };

    mockQueue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        BullModule.forRoot({
          // BullModule configuration if needed
        }),
        BullModule.registerQueue({
          name: 'delete_user_queue',
        }),
      ],
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getQueueToken('delete_user_queue'),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  describe('update', () => {
    it('should successfully update the user', async () => {
      const userId = '1';
      const updateUserDto = { email: 'new@example.com' };
      const mockUser = { _id: userId, email: 'old@example.com' };

      (mockUserModel.findById as jest.Mock).mockResolvedValue(mockUser);
      (mockUserModel.findOne as jest.Mock).mockResolvedValue(null); // No other user with new email
      (mockUserModel.findByIdAndUpdate as jest.Mock).mockResolvedValue({
        ...mockUser,
        ...updateUserDto,
      });

      const result = await service.update(userId, updateUserDto);

      expect(result).toEqual({
        statusCode: 200,
        message: 'User updated successfully',
        data: { ...mockUser, ...updateUserDto },
      });
      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: updateUserDto.email });
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(userId, updateUserDto, { new: true });
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const userId = '1';
      const updateUserDto = { email: 'new@example.com' };

      (mockUserModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.update(userId, updateUserDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if email is already in use', async () => {
      const userId = '1';
      const updateUserDto = { email: 'existing@example.com' };
      const mockUser = { _id: userId, email: 'old@example.com' };

      (mockUserModel.findById as jest.Mock).mockResolvedValue(mockUser);
      (mockUserModel.findOne as jest.Mock).mockResolvedValue({ _id: '2', email: 'existing@example.com' });

      await expect(service.update(userId, updateUserDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should throw UnauthorizedException if user does not exist', async () => {
      (mockUserModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(service.remove('non-existing-id')).rejects.toThrow(UnauthorizedException);
    });

    it('should call the deleteUserQueue with correct parameters and return success message', async () => {
      const userId = 'existing-id';
      const user = { _id: userId };

      (mockUserModel.findById as jest.Mock).mockResolvedValue(user);

      await expect(service.remove(userId)).resolves.toEqual({
        statusCode: HttpStatus.OK,
        message: 'User data processed successfully, account deleted',
      });

      expect(mockQueue.add).toHaveBeenCalledWith('deleteUser', { userId });
    });
  });
});
