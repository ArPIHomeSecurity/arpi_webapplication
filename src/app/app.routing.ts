import { Routes, RouterModule } from '@angular/router';

import { AuthGuard, AdminGuard } from './guards';

import { LoginComponent } from './login';
import { HomeComponent } from './home';
import { ZoneListComponent, ZoneDetailComponent } from './zone';
import { SensorListComponent, SensorDetailComponent } from './sensor';
import { KeypadComponent } from './keypad';
import { NotificationsComponent } from './config/notifications';
import { NetworkComponent } from './config/network';
import { ClockComponent } from './config/clock';
import { SyrenComponent } from './config/syren';
import { UserListComponent, UserDetailComponent } from './user';
import { EventsComponent } from './events/events.component';

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
    path: 'events',
    component: EventsComponent,
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
    path: 'keypad',
    component: KeypadComponent,
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
  {
    path: 'config/syren',
    component: SyrenComponent,
    canActivate: [AdminGuard]
  },
  // otherwise redirect to home
  {path: '**', redirectTo: ''}
];

export const routing = RouterModule.forRoot(appRoutes, { relativeLinkResolution: 'legacy' });
