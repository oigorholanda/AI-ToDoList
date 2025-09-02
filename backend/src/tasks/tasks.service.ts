import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  create(title: string): Promise<Task> {
    const task = this.taskRepository.create({ title });
    return this.taskRepository.save(task);
  }

  async createMany(titles: string[]): Promise<Task[]> {
    const items = titles
    .map((t) => t?.trim())
    .filter((t): t is string => Boolean(t))
    .map((title) => this.taskRepository.create({ title }));
    return this.taskRepository.save(items);
  }

  findAll(): Promise<Task[]> {
    return this.taskRepository.find();
  }

  async findPending(): Promise<Task[]> {
    return this.taskRepository.find({ where: { isCompleted: false }, order: { id: 'ASC' } });
}

  async update(id: number, isCompleted: boolean): Promise<Task> {
    const task = await this.taskRepository.findOneBy({ id });
    if (!task) throw new Error('Task not found');
    task.isCompleted = isCompleted;
    return this.taskRepository.save(task);
  }

  async completeById(id: number): Promise<Task> {
    return this.update(id, true);
  }
  
  async markAsUncompleted(id: number): Promise<Task> {
    return this.update(id, false);
  }

  async remove(id: number): Promise<void> {
    await this.taskRepository.delete(id);
  }
}
