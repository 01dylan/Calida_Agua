import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MenuItem, MenuService } from '../../services/menu.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {

  @Input() collapsed = false;

  menu: MenuItem[] = [];
  openedItems: Set<number> = new Set<number>();

  constructor(private menuService: MenuService) {}

  ngOnInit(): void {
    this.menu = this.menuService.getMenu();
  }

  toggleItem(id: number): void {
    if (this.openedItems.has(id)) {
      this.openedItems.delete(id);
    } else {
      this.openedItems.add(id);
    }
  }

  isOpen(id: number): boolean {
    return this.openedItems.has(id);
  }
}