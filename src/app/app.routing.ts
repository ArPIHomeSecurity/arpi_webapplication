import { Routes, RouterModule } from '@angular/router';

import { AuthGuard, AdminGuard } from './guards';

import { LoginComponent } from './login';
import { HomeComponent } from './home';
import { AlertListComponent } from './alert';
import { ClockComponent } from './config/clock';
import { UserListComponent, UserDetailComponent } from './user';
import { SensorListComponent, SensorDetailComponent } from './sensor';
import { ZoneListComponent, ZoneDetailComponent } from './zone';
import { NotificationsComponent } from './config/notifications';
import { NetworkComponent } from './config/network';

const appRoutes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    pathMatch: 'full',
    path: '',
    component: HomeComponent,
    canActivate: [AuthGuard]
  },
  {
      path: 'alerts',
      component: AlertListComponent,
      canActivate: [AuthGuard]
    },
  {
    path: 'users',
    component: UserListComponent,
    canActivate: [AdminGuard]
  },
  {
    path: 'user/add',
    component: UserDetailComponent,
    canActivate: [AdminGuard]
  },
  {
    path: 'user/:id',
    component: UserDetailComponent,
    canActivate: [AdminGuard]
  },
  {
    path: 'sensors',
    component: SensorListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'sensor/add',
    component: SensorDetailComponent,
    canActivate: [AdminGuard]
  },
  {
    path: 'sensor/:id',
    component: SensorDetailComponent,
    canActivate: [AdminGuard]
  },
  {
    path: 'zones',
    component: ZoneListComponent,
    canActivate: [AdminGuard]
  },
  {
    path: 'zone/add',
    component: ZoneDetailComponent,
    canActivate: [AdminGuard]
  },
  {
    path: 'zone/:id',
    component: ZoneDetailComponent,
    canActivate: [AdminGuard]
  },
  {
    path: 'config/notifications',
    component: NotificationsComponent,
    canActivate: [AdminGuard]
  },
  {
    path: 'config/network',
    component: NetworkComponent,
    canActivate: [AdminGuard]
  },
  {
    path: 'config/clock',
    component: ClockComponent,
    canActivate: [AdminGuard]
  },
  
  // otherwise redirect to home
  {path: '**', redirectTo: ''}
];

export const routing = RouterModule.forRoot(appRoutes);
