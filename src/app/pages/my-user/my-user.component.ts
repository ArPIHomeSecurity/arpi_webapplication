import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ConfigurationBaseComponent } from '@app/configuration-base/configuration-base.component';
import { Card, User } from '@app/models';
import { AuthenticationService } from '@app/services';
import { AUTHENTICATION_SERVICE } from '@app/tokens';

@Component({
  selector: 'my-user',
  standalone: false,
  templateUrl: './my-user.component.html',
  styleUrl: './my-user.component.scss'
})
export class MyUserComponent extends ConfigurationBaseComponent implements OnInit, OnDestroy {

  user: User = null;

  constructor(
    @Inject(AUTHENTICATION_SERVICE) public authenticationService: AuthenticationService,
    @Inject('EventService') public eventService,
    @Inject('UserService') private userService,
    @Inject('LoaderService') public loader,
    @Inject('MonitoringService') public monitoringService,
    public router: Router,
  ) {
    super(eventService, loader, monitoringService);
  }

  ngOnInit(): void {
    super.initialize();

    const userId = this.authenticationService.getUserId();
    this.userService.getUser(userId)
      .subscribe({
        next: user => this.user = user,
        error: error => console.error(error)
      });
  }

  ngOnDestroy(): void {
    super.destroy();
  }

  onNavigateToUserEdit(): void {
    this.router.navigate(['/user', 'my-user']);
  }
}
