import { Routes, RouterModule } from '@angular/router';

import { AuthGuard, AdminGuard } from './guards';

import { LoginComponent } from './pages/login';
import { HomeComponent } from './pages/home';
import { ZoneListComponent, ZoneDetailComponent } from './pages/zone';
import { SensorListComponent, SensorDetailComponent } from './pages/sensor';
import { KeypadComponent } from './pages/config/keypad';
import { NotificationsComponent } from './pages/config/notifications';
import { NetworkComponent } from './pages/config/network';
import { ClockComponent } from './pages/config/clock';
import { SyrenComponent } from './pages/config/syren';
import { UserListComponent, UserDetailComponent } from './pages/user';
import { EventsComponent } from './pages/events/events.component';
import { AreaDetailComponent, AreaListComponent } from './pages/area';
import { OutputDetailComponent, OutputListComponent } from './pages/output';

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
    canActivate: [AuthGuard]
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
    canActivate: [AuthGuard]
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
    path: 'areas',
    component: AreaListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'area/add',
    component: AreaDetailComponent,
    canActivate: [AdminGuard]
  },
  {
    path: 'area/:id',
    component: AreaDetailComponent,
    canActivate: [AdminGuard]
  },
  {
    path: 'config/keypad',
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
  {
    path: 'outputs',
    component: OutputListComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'output/add',
    component: OutputDetailComponent,
    canActivate: [AdminGuard]
  },
  {
    path: 'output/:id',
    component: OutputDetailComponent,
    canActivate: [AdminGuard]
  },
  // otherwise redirect to home
  {path: '**', redirectTo: ''}
];

export const routing = RouterModule.forRoot(appRoutes, {});
