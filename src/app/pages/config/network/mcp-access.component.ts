import { Component, Inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { ConfigurationService } from '@app/services';
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { A11yModule } from "@angular/cdk/a11y";
import { getValue } from '@app/utils';

@Component({
  selector: 'app-mcp-access',
  templateUrl: 'mcp-access.component.html',
  styleUrls: ['mcp-access.component.scss'],
  standalone: true,
  imports: [MatExpansionModule, MatButtonModule, MatIconModule, RouterModule, MatFormFieldModule, MatInputModule, A11yModule]
})
export class McpAccessComponent implements OnInit {

    hostname: any = null;

    constructor(
        @Inject('ConfigurationService') private configService: ConfigurationService,
    ) {

    }

    ngOnInit() {
        this.configService.getOption('network', 'dyndns').subscribe((dyndns) => {
            if (dyndns) {
                this.hostname = getValue(dyndns.value, "hostname", null);
            }
        });
    }
}
