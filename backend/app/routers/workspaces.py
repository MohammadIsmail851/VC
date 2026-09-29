import uuid
from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from ..models.schemas import (
    Workspace, WorkspaceCreate, WorkspaceMember, DashboardResponse,
    UserProfile
)
from ..dependencies import get_current_user, verify_workspace_access
from ..services.demo_store import demo_store, DEMO_WORKSPACE_ID
from ..services.hindsight_service import hindsight_service
from .integrations import get_integrations_status

router = APIRouter(prefix="/api/workspaces", tags=["Workspaces"])

@router.get("", response_model=List[Workspace])
async def list_workspaces(current_user: UserProfile = Depends(get_current_user)):
    """List all workspaces accessible to the authenticated user."""
    return [demo_store.workspace]

@router.post("", response_model=Workspace, status_code=status.HTTP_201_CREATED)
async def create_workspace(
    data: WorkspaceCreate,
    current_user: UserProfile = Depends(get_current_user)
):
    """Create a new workspace with authenticated user as owner."""
    new_ws = Workspace(
        id=f"ws-{str(uuid.uuid4())[:8]}",
        name=data.name,
        description=data.description,
        created_by=current_user.uid,
        created_at=datetime.utcnow(),
        members=[
            WorkspaceMember(
                user_id=current_user.uid,
                display_name=current_user.display_name,
                email=current_user.email,
                role="owner",
                avatar_url=current_user.avatar_url
            )
        ],
        is_demo=False
    )
    return new_ws

@router.get("/{workspace_id}/dashboard", response_model=DashboardResponse)
async def get_workspace_dashboard(
    workspace_id: str = Depends(verify_workspace_access),
    current_user: UserProfile = Depends(get_current_user)
):
    """
    Get dashboard metrics, recent activity, decisions, and tasks.
    All metrics are derived directly from verified database/store records.
    """
    stats = demo_store.get_dashboard()
    recent_activity = demo_store.activity_events[:8]
    recent_decisions = demo_store.decisions[:4]
    upcoming_tasks = [t for t in demo_store.tasks if t.status != "done"][:5]
    
    int_overview = await get_integrations_status()

    return DashboardResponse(
        workspace=demo_store.workspace,
        stats=stats,
        recent_activity=recent_activity,
        recent_decisions=recent_decisions,
        upcoming_tasks=upcoming_tasks,
        integration_health=int_overview.integrations,
        is_demo=True
    )

# --- Projects Management ---
from ..models.schemas import Project, ProjectCreate, ProjectUpdate, MemberInvite, MemberRoleUpdate

@router.get("/{workspace_id}/projects", response_model=List[Project])
async def list_workspace_projects(
    workspace_id: str = Depends(verify_workspace_access),
    current_user: UserProfile = Depends(get_current_user)
):
    """List all projects in workspace."""
    return demo_store.projects

@router.post("/{workspace_id}/projects", response_model=Project, status_code=status.HTTP_201_CREATED)
async def create_workspace_project(
    data: ProjectCreate,
    workspace_id: str = Depends(verify_workspace_access),
    current_user: UserProfile = Depends(get_current_user)
):
    """Create a new project within the workspace."""
    proj = Project(
        id=f"proj-{str(uuid.uuid4())[:8]}",
        workspace_id=workspace_id,
        name=data.name,
        description=data.description,
        status=data.status or "active",
        created_at=datetime.utcnow()
    )
    return demo_store.add_project(proj, actor=current_user.display_name)

@router.put("/{workspace_id}/projects/{project_id}", response_model=Project)
async def update_workspace_project(
    project_id: str,
    data: ProjectUpdate,
    workspace_id: str = Depends(verify_workspace_access),
    current_user: UserProfile = Depends(get_current_user)
):
    """Update project name, description or status."""
    updates = data.dict(exclude_unset=True)
    proj = demo_store.update_project(project_id, updates, actor=current_user.display_name)
    if not proj:
        raise HTTPException(status_code=404, detail="Project not found.")
    return proj

@router.delete("/{workspace_id}/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workspace_project(
    project_id: str,
    workspace_id: str = Depends(verify_workspace_access),
    current_user: UserProfile = Depends(get_current_user)
):
    """Delete a project from workspace."""
    success = demo_store.delete_project(project_id, actor=current_user.display_name)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found.")
    return None

# --- Team Members Management ---
@router.get("/{workspace_id}/members", response_model=List[WorkspaceMember])
async def list_workspace_members(
    workspace_id: str = Depends(verify_workspace_access),
    current_user: UserProfile = Depends(get_current_user)
):
    """List all team members in workspace."""
    return demo_store.members

@router.post("/{workspace_id}/members", response_model=WorkspaceMember, status_code=status.HTTP_201_CREATED)
async def invite_workspace_member(
    data: MemberInvite,
    workspace_id: str = Depends(verify_workspace_access),
    current_user: UserProfile = Depends(get_current_user)
):
    """Invite a new team member to the workspace."""
    member = WorkspaceMember(
        user_id=f"user-{str(uuid.uuid4())[:8]}",
        display_name=data.display_name,
        email=data.email,
        role=data.role,
        avatar_url=data.avatar_url or f"https://api.dicebear.com/7.x/avataaars/svg?seed={data.display_name.replace(' ', '')}",
        joined_at=datetime.utcnow()
    )
    return demo_store.add_member(member, actor=current_user.display_name)

@router.patch("/{workspace_id}/members/{user_id}", response_model=WorkspaceMember)
async def update_member_role_endpoint(
    user_id: str,
    data: MemberRoleUpdate,
    workspace_id: str = Depends(verify_workspace_access),
    current_user: UserProfile = Depends(get_current_user)
):
    """Update role for a member."""
    member = demo_store.update_member_role(user_id, data.role, actor=current_user.display_name)
    if not member:
        raise HTTPException(status_code=404, detail="Member not found.")
    return member

@router.delete("/{workspace_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_workspace_member(
    user_id: str,
    workspace_id: str = Depends(verify_workspace_access),
    current_user: UserProfile = Depends(get_current_user)
):
    """Remove a team member from workspace."""
    success = demo_store.remove_member(user_id, actor=current_user.display_name)
    if not success:
        raise HTTPException(status_code=404, detail="Member not found.")
    return None
