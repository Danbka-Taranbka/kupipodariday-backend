import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { UserAlreadyExistsEception } from 'src/exceptions/user-exist.exception';
import { NotFoundEception } from 'src/exceptions/not-found.exception';
import { Wish } from 'src/wishes/entities/wish.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const { password, ...rest } = createUserDto;

      const hash = await bcrypt.hash(password, 10);

      const user = this.usersRepository.create({
        ...createUserDto,
        password: hash,
      });
  
      await this.usersRepository.insert(user);
  
      return user;
    } catch(err) {
      throw new UserAlreadyExistsEception();
    }
  };

  async findAll(): Promise<User[]> {
    const result = await this.usersRepository.find();
    return result;
  };

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) throw new NotFoundEception;

    return user;
  };

  async findMany(query: string): Promise<User[] | undefined> {
    const result = await this.usersRepository.find({
      where: [
        { username: query },
        { email: query }
      ],
    });

    return result;
  };

  async findByUsername(username: string) {
    const user = await this.usersRepository.findOneBy({ username });

    return user;
  };

  async findByEmail(email: string) {
    const user = await this.usersRepository.findBy({ email });

    return user;
  };

  async findUserWishes(username: string): Promise<Wish[]> {
    const result = await this.usersRepository.findOne({
      where: {
        wishes: {
          owner: {
            username: username
          },
        },
      },
      relations: {
        wishes: {
          owner: true,
          offers: true,
        },
      },
    });

    if (!result) {
      return [];
    }

    return result.wishes;
  }

  async update(user: User, updateUserDto: UpdateUserDto) {
    try {
      if (updateUserDto.password) {
        updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
      }
    } catch(err) {
      throw new UnauthorizedException();
    }

    return await this.usersRepository.update(user.id, updateUserDto);
  };

  async remove(id: number) {
    const user = await this.usersRepository.findOneBy({ id });

    if (!user) throw new NotFoundEception;

    return await this.usersRepository.delete(id);
  };
}
