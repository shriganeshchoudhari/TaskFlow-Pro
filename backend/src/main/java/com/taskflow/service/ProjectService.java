package com.taskflow.service;

import com.taskflow.dto.request.*;
import com.taskflow.dto.response.*;
import com.taskflow.exception.*;
import com.taskflow.model.*;
import com.taskflow.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;
    private final ActivityService activityService;

    // ── CRUD ──────────────────────────────────────────────────────────────────

    @Transactional
    public ProjectResponse createProject(CreateProjectRequest req, UserDetails currentUser) {
        User owner = resolveUser(currentUser);

        Project project = Project.builder()
            .name(req.getName())
            .description(req.getDescription())
            .status(Project.ProjectStatus.valueOf(
                req.getStatus() != null ? req.getStatus() : "ACTIVE"))
            .visibility(Project.ProjectVisibility.valueOf(
                req.getVisibility() != null ? req.getVisibility() : "PRIVATE"))
            .owner(owner)
            .build();

        Project saved = projectRepository.save(project);

        // Auto-add creator as MANAGER
        ProjectMember ownerMember = ProjectMember.builder()
            .project(saved)
            .user(owner)
            .role(User.Role.MANAGER)
            .build();
        projectMemberRepository.save(ownerMember);

        activityService.logActivity("PROJECT_CREATED", "PROJECT", saved.getId(),
            owner, saved, null, null, null);

        log.info("Project created: {} by {}", saved.getId(), owner.getEmail());
        return ProjectResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public Page<ProjectResponse> getProjects(String status, int page, int size,
                                              UserDetails currentUser) {
        User user = resolveUser(currentUser);
        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedAt").descending());
        return projectRepository
            .findAccessibleByUserId(user.getId(), status, pageable)
            .map(ProjectResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public ProjectResponse getById(UUID projectId, UserDetails currentUser) {
        User user = resolveUser(currentUser);
        Project project = projectRepository
            .findByIdAndAccessibleByUser(projectId, user.getId())
            .orElseThrow(() -> new ResourceNotFoundException(
                "Project not found or access denied: " + projectId));
        return ProjectResponse.fromEntity(project);
    }

    @Transactional
    public ProjectResponse updateProject(UUID projectId, UpdateProjectRequest req,
                                          UserDetails currentUser) {
        User user = resolveUser(currentUser);
        Project project = findProjectOrThrow(projectId);
        assertManagerOrAdmin(projectId, user);

        if (req.getName() != null)        project.setName(req.getName());
        if (req.getDescription() != null)  project.setDescription(req.getDescription());
        if (req.getStatus() != null)
            project.setStatus(Project.ProjectStatus.valueOf(req.getStatus()));
        if (req.getVisibility() != null)
            project.setVisibility(Project.ProjectVisibility.valueOf(req.getVisibility()));

        Project saved = projectRepository.save(project);
        activityService.logActivity("PROJECT_UPDATED", "PROJECT", saved.getId(),
            user, saved, null, null, null);
        return ProjectResponse.fromEntity(saved);
    }

    @Transactional
    public void archiveProject(UUID projectId, UserDetails currentUser) {
        User user = resolveUser(currentUser);
        Project project = findProjectOrThrow(projectId);
        assertManagerOrAdmin(projectId, user);

        project.setStatus(Project.ProjectStatus.ARCHIVED);
        projectRepository.save(project);
        activityService.logActivity("PROJECT_ARCHIVED", "PROJECT", projectId,
            user, project, null, "ACTIVE", "ARCHIVED");
        log.info("Project archived: {} by {}", projectId, user.getEmail());
    }

    // ── Members ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<MemberResponse> getMembers(UUID projectId, UserDetails currentUser) {
        User user = resolveUser(currentUser);
        assertProjectMember(projectId, user.getId());
        return projectMemberRepository.findByProjectIdWithUser(projectId)
            .stream().map(MemberResponse::fromEntity).toList();
    }

    @Transactional
    public MemberResponse addMember(UUID projectId, AddProjectMemberRequest req,
                                     UserDetails currentUser) {
        User requester = resolveUser(currentUser);
        assertManagerOrAdmin(projectId, requester);

        User newMember = userRepository.findByEmail(req.getEmail().toLowerCase())
            .orElseThrow(() -> new ResourceNotFoundException(
                "User not found with email: " + req.getEmail()));

        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, newMember.getId())) {
            throw new ConflictException("User is already a member of this project");
        }

        Project project = findProjectOrThrow(projectId);
        ProjectMember pm = ProjectMember.builder()
            .project(project)
            .user(newMember)
            .role(User.Role.valueOf(req.getRole() != null ? req.getRole() : "MEMBER"))
            .build();

        ProjectMember saved = projectMemberRepository.save(pm);
        activityService.logActivity("MEMBER_ADDED", "PROJECT", projectId,
            requester, project, null, null, newMember.getEmail());
        return MemberResponse.fromEntity(saved);
    }

    @Transactional
    public void removeMember(UUID projectId, UUID userId, UserDetails currentUser) {
        User requester = resolveUser(currentUser);
        assertManagerOrAdmin(projectId, requester);

        Project project = findProjectOrThrow(projectId);
        if (project.getOwner().getId().equals(userId)) {
            throw new ForbiddenException("Cannot remove the project owner");
        }

        projectMemberRepository.deleteByProjectIdAndUserId(projectId, userId);
        activityService.logActivity("MEMBER_REMOVED", "PROJECT", projectId,
            requester, project, null, userId.toString(), null);
    }

    @Transactional
    public MemberResponse updateMemberRole(UUID projectId, UUID userId,
                                            UpdateMemberRoleRequest req,
                                            UserDetails currentUser) {
        User requester = resolveUser(currentUser);
        assertManagerOrAdmin(projectId, requester);

        ProjectMember pm = projectMemberRepository
            .findByProjectIdAndUserId(projectId, userId)
            .orElseThrow(() -> new ResourceNotFoundException("Member not found in project"));
        pm.setRole(User.Role.valueOf(req.getRole()));
        return MemberResponse.fromEntity(projectMemberRepository.save(pm));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Project findProjectOrThrow(UUID projectId) {
        return projectRepository.findById(projectId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Project not found: " + projectId));
    }

    private User resolveUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new UnauthorizedException("User not found"));
    }

    private void assertProjectMember(UUID projectId, UUID userId) {
        if (!projectMemberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            throw new ForbiddenException("You are not a member of this project");
        }
    }

    private void assertManagerOrAdmin(UUID projectId, User user) {
        if (user.getRole() == User.Role.ADMIN) return;
        ProjectMember pm = projectMemberRepository
            .findByProjectIdAndUserId(projectId, user.getId())
            .orElseThrow(() -> new ForbiddenException("You are not a member of this project"));
        if (pm.getRole() != User.Role.MANAGER) {
            throw new ForbiddenException("Only project managers can perform this action");
        }
    }
}
