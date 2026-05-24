import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../modules/users/user.entity';
import { Role } from '../modules/roles/role.entity';
import { PermissionsService } from './permissions/permissions.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User, Role])],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class CommonModule {}
