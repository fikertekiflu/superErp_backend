import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { Employee } from './entities/employee.entity';
import { Department } from './entities/department.entity';
import { Position } from './entities/position.entity';
import { WorkflowExecutionService } from '../workflows/workflow-execution.service';

@Injectable()
export class HrmService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepository: Repository<Employee>,
    @InjectRepository(Department)
    private departmentRepository: Repository<Department>,
    @InjectRepository(Position)
    private positionRepository: Repository<Position>,
    private moduleRef: ModuleRef,
  ) {}

  async findAll(tenantId: string): Promise<Employee[]> {
    return this.employeeRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  // Department Methods
  async findAllDepartments(tenantId: string): Promise<Department[]> {
    return this.departmentRepository.find({ where: { tenantId } });
  }

  async createDepartment(tenantId: string, data: Partial<Department>): Promise<Department> {
    const dept = this.departmentRepository.create({ ...data, tenantId });
    return this.departmentRepository.save(dept);
  }

  async removeDepartment(id: string, tenantId: string): Promise<void> {
    await this.departmentRepository.delete({ id, tenantId });
  }

  // Position Methods
  async findAllPositions(tenantId: string): Promise<Position[]> {
    return this.positionRepository.find({ where: { tenantId } });
  }

  async createPosition(tenantId: string, data: Partial<Position>): Promise<Position> {
    const pos = this.positionRepository.create({ ...data, tenantId });
    return this.positionRepository.save(pos);
  }

  async removePosition(id: string, tenantId: string): Promise<void> {
    await this.positionRepository.delete({ id, tenantId });
  }

  async findOne(id: string, tenantId: string): Promise<Employee> {
    const employee = await this.employeeRepository.findOne({
      where: { id, tenantId },
    });
    if (!employee) throw new NotFoundException('Employee not found');
    return employee;
  }

  async create(tenantId: string, data: Partial<Employee>, createdBy?: string): Promise<Employee> {
    const employee = this.employeeRepository.create({
      ...data,
      tenantId,
    });
    const saved = await this.employeeRepository.save(employee);

    // Trigger employee onboarding workflows
    try {
      const workflowService = this.moduleRef.get(WorkflowExecutionService, { strict: false });
      await workflowService.triggerWorkflow(
        'employee-onboarding', // This would be the workflow ID/name
        createdBy || 'system',
        tenantId,
        {
          entityId: saved.id,
          entityType: 'Employee',
          entityData: saved,
          triggerType: 'event_based',
        },
      );
      console.log(`🔥 Employee onboarding workflow triggered for ${saved.firstName} ${saved.lastName}`);
    } catch (error) {
      console.warn('Failed to trigger employee onboarding workflow:', error);
    }

    return saved;
  }

  async update(id: string, tenantId: string, data: Partial<Employee>): Promise<Employee> {
    await this.findOne(id, tenantId);
    await this.employeeRepository.update(id, data);
    return this.findOne(id, tenantId);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const employee = await this.findOne(id, tenantId);
    await this.employeeRepository.remove(employee);
  }
}
