import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

@ Component({
  selector: 'app-principal',
  imports: [RouterModule],
  templateUrl: './principal.html',
  styleUrl: './principal.scss',
})

export class Principal implements OnInit{
  router=inject(Router);
  
  ngOnInit(): void {
    
  }
  logout(){
    this.router.navigate( ['/login']);
  }
}
